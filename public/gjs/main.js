class M_Object {
    constructor() {
        this.assignUniqueId();
    }

    assignUniqueId() {
        let UnixTS = Date.now();
        let PerformTS = performance.now();

        PerformTS = PerformTS - parseInt(PerformTS);
        PerformTS *= 1000;
        PerformTS = parseInt(PerformTS);

        UnixTS = UnixTS * 1000 + PerformTS
        this.UniqueId = UnixTS;
    }

}

class I_bindingWidgets {
    bindingWidgets = [];

    addBindingWidget(_widget) {
        this.bindingWidgets.push(_widget);
    }

    removeBindingWidget(_widget) {
        this.bindingWidgets.remove(_widget);
    }

    updateBindingWidgets() {
        for (let i = 0; i < this.bindingWidgets.length; ++i) {
            this.bindingWidgets[i].updateBindingData(this);
        }
    }

    destroyBindingWidgets() {
        for (let i = this.bindingWidgets.length - 1; i >= 0; --i) {
            this.bindingWidgets[i].destroy();
        }
    }

    delete() {
        if (this instanceof M_Struct) {
            for (let i = this.bindingVariables.length - 1; i >= 0; --i) {
                this.bindingVariables[i].delete();
            }
        }
        this.destroyBindingWidgets();
        this.removeFromBelongArray();
        this.tryVarRemoveFromBindingVariables();
    }

    tryVarRemoveFromBindingVariables() {
        if (this instanceof M_Variable) {
            if (this.selectedDataType) {
                this.selectedDataType.tryRemoveFromBindingVariables(this);
            }
        }
    }
}

class I_belongArray {
    belongArray = [];

    setBelongArray(_arr) {
        this.belongArray = _arr;
    }

    removeFromBelongArray() {
        this.belongArray.remove(this);
    }
}

class I_memberVariableArr {
    memberVariableArr = [];
}

class I_bindingVariables {
    bindingVariables = [];

    tryRemoveFromBindingVariables(_data) {
        if (this instanceof M_Struct) {
            this.removeFromBindingVariables(_data);
        }
    }

    tryAddToBindingVariables(_data) {
        if (this instanceof M_Struct) {
            this.addToBindingVariables(_data);
        }
    }

    removeFromBindingVariables(_data) {
        this.bindingVariables.remove(_data);
    }

    addToBindingVariables(_data) {
        this.bindingVariables.push(_data);
    }

    updateBindingVariables() {
        for (let i = 0; i < this.bindingVariables.length; ++i) {
            this.bindingVariables[i].dataType = this.dataType;
            this.bindingVariables[i].updateBindingWidgets();
        }
    }
}

class M_Variable extends Super_Interfaces(M_Object, I_bindingWidgets, I_bindingVariables, I_belongArray, I_memberVariableArr) {
    type = "base";

    dataType = "Int";
    identifier = "var";
    color = "#00D9C9";
    bPointer = false;

    selectedDataType = null;

    constructor(_type, _dataType, _identifier, _belongArray, _bPointer, _color) {
        super();

        if (_type) {
            this.type = _type;
        }

        if (_dataType) {
            this.dataType = _dataType;
        }

        if (_identifier) {
            this.identifier = _identifier;
        }

        if (_belongArray) {
            this.setBelongArray(_belongArray);
        }

        if (_color) {
            this.color = _color;
        } else {
            this.color = getRealRandomColor();
        }
    }

    selectDataType(_dataType) {
        let newType = TypeManager.getTypeByString(_dataType);

        if (!newType) {
            return;
        }

        if (this.selectedDataType) {
            this.selectedDataType.tryRemoveFromBindingVariables(this);
        }

        this.selectedDataType = newType;
        this.selectedDataType.tryAddToBindingVariables(this);

        this.type = this.selectedDataType.type;
        this.dataType = this.selectedDataType.dataType;
        this.color = this.selectedDataType.color;
        this.memberVariableArr = this.selectedDataType.memberVariableArr;

        this.updateBindingWidgets();
    }

    setIdentifier(_identifier) {
        this.identifier = _identifier;
        this.updateBindingWidgets();
    }

    Type_CCode() {
        if (this.type === "struct") {
            if (this.bPointer === true) {
                return this.dataType + "*";
            }
            return this.dataType;
        } else {
            if (this.bPointer === true) {
                return this.dataType.toLowerCase() + "*";
            }
            return this.dataType.toLowerCase();
        }
    }

    CCodeDefinition() {
        let expressions = [];

        expressions.push(this.Type_CCode() + " " + this.identifier + ";");

        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.UniqueId = this.UniqueId;
        obj.color = this.color;
        obj.jsonType = "variable";
        obj.type = this.type;
        obj.dataType = this.dataType;
        obj.identifier = this.identifier;
        obj.bPointer = this.bPointer;

        return obj;
    }
}

class M_Struct extends Super_Interfaces(M_Variable) {
    varNamePrefix = "var"
    varNameIndex = 0;

    constructor(_type, _dataType, _identifier, _belongArray, _color) {
        super(_type, _dataType, _identifier, _belongArray, _color);
    }

    setDataTypeByString(_dataType) {
        this.dataType = _dataType;
        console.log(this.dataType);

        for (let i = 0; i < this.bindingVariables.length; ++i) {
            this.bindingVariables[i].dataType = this.dataType;
        }

        this.updateBindingWidgets();
    }

    updateBindingWidgets() {
        M_Variable.prototype.updateBindingWidgets.call(this);
        this.updateBindingVariables();
    }

    CCodeDeclaration() {
        let expressions = [];
        expressions.push("typedef struct " + this.dataType + " " + this.dataType + ";");
        return expressions;
    }

    CCodeDefinition() {
        let expressions = [];

        expressions.push("typedef struct " + this.dataType + "{");

        for (let i = 0; i < this.memberVariableArr.length; ++i) {
            expressions.push(...this.memberVariableArr[i].CCodeDefinition());
        }
        expressions.push("}" + this.dataType + ";");
        return expressions;
    }

    // updateBindingWidgets() {
    //     for (let i = 0; i < this.bindingVariables.length; ++i) {
    //         this.bindingVariables[i].updateBindingWidgets();
    //     }

    //     // for(let i = 0;i<this.bindingWidgets.length;++i){
    //     //     this.bindingWidgets[i].updateBindingData(this);
    //     // }
    // }

    toJsonData() {
        let obj = new Object();
        obj.UniqueId = this.UniqueId;
        obj.color = this.color;
        obj.jsonType = "struct";
        obj.type = this.type;
        obj.dataType = this.dataType;
        obj.identifier = this.identifier;

        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        obj.memberVariableArr = [];

        for (let i = 0; i < this.memberVariableArr.length; ++i) {
            obj.memberVariableArr.push(this.memberVariableArr[i].toJsonData());
        }
        return obj;
    }
}

class M_Function extends Super_Interfaces(M_Object, I_bindingWidgets, I_belongArray) {
    variables = [];
    bindingWidgets = [];

    varNamePrefix = "var"
    varNameIndex = 0;

    nodeJsonDataArray = [];

    constructor(_name, _input, _return, _variable) {
        super();

        if (!_name) _name = "func";
        if (!_input) _input = [];
        if (!_return) _return = [this.getDefaultVariable()];
        if (!_variable) _variable = [this.getDefaultVariable(), this.getDefaultVariable()];

        this.name = _name;
        this.input = _input;
        this.return = _return;
        this.variables = _variable;
        this.setBelongArray(coderoot.M_Functions);


        for (let i = 0; i < this.input.length; ++i) {
            this.input[i].belongArray = this.input;
        }

        for (let i = 0; i < this.return.length; ++i) {
            this.return[i].belongArray = this.return;
        }

        for (let i = 0; i < this.variables.length; ++i) {
            this.variables[i].belongArray = this.variables;
        }
    }

    destroyBindingWidgetsGUIOnly() {
        for (let i = this.bindingWidgets.length - 1; i >= 0; --i) {
            if (!(this.bindingWidgets[i] instanceof G_Function_Field_Widget)) {
                this.bindingWidgets[i].destroy();
                this.bindingWidgets.remove(this.bindingWidgets[i]);
            }
        }
    }

    deleteGUI() {
        this.destroyBindingWidgetsGUIOnly();
    }

    delete() {
        for (let i = this.input.length - 1; i >= 0; --i) {
            this.input[i].delete();
        }

        for (let i = this.return.length - 1; i >= 0; --i) {
            this.return[i].delete();
        }

        for (let i = this.variables.length - 1; i >= 0; --i) {
            this.variables[i].delete();
        }

        I_bindingWidgets.prototype.delete.call(this);
    }

    setFunctionName(_name) {
        this.name = _name;
        this.updateBindingWidgets();
    }

    getDefaultVariable() {
        let defaultVar = TypeManager.getBaseTypeVariable();
        defaultVar.setIdentifier(this.getNextVariableName());
        return defaultVar;
    }

    getNextVariableName() {
        return this.varNamePrefix + this.varNameIndex++;
    }

    unload() {
        this.deleteGUI();
        console.log("unload");
    }

    getConnectorByIdFromArray(_id, _arr) {
        for (let i = 0; i < _arr.length; ++i) {
            if (_arr[i].UniqueId === _id) {
                return _arr[i];
            }
        }
    }

    load() {
        let nodeArray = [];
        for (let i = 0; i < this.nodeJsonDataArray.length; ++i) {
            nodeArray.push(nodeLoader.loadNode(this.nodeJsonDataArray[i]));
        }

        let connectorArray = [];
        for (let i = 0; i < nodeArray.length; ++i) {
            let arr = nodeArray[i].getAllConnectors();
            connectorArray.push(...arr);
        }
        console.log("load");
        // console.log(connectorArray);
        // console.log(this.nodeJsonDataArray);

        for (let i = 0; i < this.nodeJsonDataArray.length; ++i) {
            let conInfoArray = this.nodeJsonDataArray[i].conInfoArray;
            for (let j = 0; j < conInfoArray.length; ++j) {
                if (conInfoArray[j].UniqueId === null || conInfoArray[j].ConnectedId === null) {
                    continue;
                }
                let con1 = this.getConnectorByIdFromArray(conInfoArray[j].UniqueId, connectorArray);
                let con2 = this.getConnectorByIdFromArray(conInfoArray[j].ConnectedId, connectorArray);
                if (con1 && con2) {
                    con1.connectTo(con2);

                    con1.updateCenterXY();
                    con1.updateActivatedWire(0, 0);
                    con2.updateCenterXY();
                    con2.updateActivatedWire(0, 0);
                } else {
                    console.log("can't find node");
                }
            }

        }
    }

    getInputNode() {
        for (var i = 0; i < this.bindingWidgets.length; ++i) {
            if (this.bindingWidgets[i] instanceof G_InputNode) {
                return this.bindingWidgets[i];
            }
        }
    }

    GetNextNode(currentNode, _bSub) {
        let ExecOutArr = [];

        if (currentNode.connectedWidgets) {
            for (var i = 0; i < currentNode.connectedWidgets.length; ++i) {
                if (currentNode.connectedWidgets[i] instanceof G_Exec_Out_Widget) {
                    ExecOutArr.push(currentNode.connectedWidgets[i]);
                    // return currentNode.connectedWidgets[i].connectedWidget.getDraggableWidget();
                }
            }
        }

        function compare(con1, con2) {
            if (con1.classparent.children.indexOf(con1) < con2.classparent.children.indexOf(con2)) {
                return -1;
            }
            if (con1.classparent.children.indexOf(con1) > con2.classparent.children.indexOf(con2)) {
                return 1;
            }
            return 0;
        }

        ExecOutArr.sort(compare);

        if (_bSub === true && ExecOutArr[1] && ExecOutArr[1].connectedWidget) {
            return ExecOutArr[1].connectedWidget.getDraggableWidget();
        } else if (ExecOutArr[0] && ExecOutArr[0].connectedWidget) {
            return ExecOutArr[0].connectedWidget.getDraggableWidget();
        }

    }

    generateFunctionBody() {
        console.log("<--------- generateFunctionBody --------->");
        let expressions = [];

        let structs = TypeManager.baseTypeArray.filter(ele => ele instanceof M_Struct);

        for (let i = 0; i < structs.length; ++i) {
            expressions.push(...structs[i].CCodeDeclaration());
        }

        for (let i = 0; i < structs.length; ++i) {
            expressions.push(...structs[i].CCodeDefinition());
        }

        for (let i = 0; i < coderoot.M_Variables.length; ++i) {
            expressions.push(...coderoot.M_Variables[i].CCodeDefinition());
        }

        for (let i = 0; i < coderoot.M_Functions.length; ++i) {
            expressions.push(...coderoot.M_Functions[i].CCodeDeclaration());
        }

        expressions.push(666)
        for (let i = 0; i < coderoot.M_Functions.length; ++i) {
            expressions.push(...coderoot.M_Functions[i].CCodeDefinition());
        }
        expressions.push(999)

        // let nextNode = this.getInputNode();

        // while (nextNode) {
        //     expressions.push(...nextNode.generateCCode());
        //     nextNode = this.GetNextNode(nextNode);
        // }

        for (let i = 0; i < expressions.length; ++i) {
            console.log(expressions[i]);
        }

    }

    CCodeDeclaration() {
        let expressions = [];

        var exp = "";

        var returnType = "void";
        if (this.return[0]) {
            returnType = this.return[0].Type_CCode();
        }


        const functionName = this.name;

        exp += (returnType + " ");
        exp += (functionName + "(");

        this.input.forEach(ele => {
            exp += (ele.Type_CCode() + " " + ele.identifier + ", ");
        });

        if (this.input.length > 0) {
            exp = exp.substring(exp, exp.length - 2);
        }

        exp += ");";

        expressions.push(exp);
        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.UniqueId = this.UniqueId;
        obj.jsonType = "function";
        obj.name = this.name;
        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        obj.nodeJsonDataArray = this.nodeJsonDataArray;

        obj.inputJsonData = [];
        obj.returnJsonData = [];
        obj.variableJsonData = [];

        for (let i = 0; i < this.input.length; ++i) {
            obj.inputJsonData.push(this.input[i].toJsonData());
        }

        for (let i = 0; i < this.return.length; ++i) {
            obj.returnJsonData.push(this.return[i].toJsonData());
        }

        for (let i = 0; i < this.variables.length; ++i) {
            obj.variableJsonData.push(this.variables[i].toJsonData());
        }

        return obj;
    }
}

class Type_Manager {
    dataTypeArray = [
        // { "type": "base", "dataType": "Void", "identifier": "var", "color": "#646464" },
        // { "type": "base", "dataType": "Char", "identifier": "var", "color": "#D90000" },
        // { "type": "base", "dataType": "UChar", "identifier": "var", "color": "#D9B500" },
        // { "type": "base", "dataType": "Short", "identifier": "var", "color": "#A1D900" },
        // { "type": "base", "dataType": "UShort", "identifier": "var", "color": "#00D90D" },
        { "type": "base", "dataType": "Int", "identifier": "var", "color": "#00D9C9" },
        // { "type": "base", "dataType": "UInt", "identifier": "var", "color": "#008DD9" },
        // { "type": "base", "dataType": "Long", "identifier": "var", "color": "#0017D9" },
        // { "type": "base", "dataType": "ULong", "identifier": "var", "color": "#6300D9" },
        { "type": "base", "dataType": "Float", "identifier": "var", "color": "#CC00D9" },
        // { "type": "base", "dataType": "Double", "identifier": "var", "color": "#D56802" },
    ];

    baseTypeArray = [];

    constructor() {
        this.InitializeTypes();
    }

    InitializeTypes() {
        let that = this;
        this.dataTypeArray.forEach(dataType => {
            let new_Var = new M_Variable(dataType.type, dataType.dataType, dataType.identifier, that.baseTypeArray, that.bPointer, dataType.color);
            that.baseTypeArray.push(new_Var);
        });
    }

    getTypeByString(_typeStr) {
        for (let i = 0; i < this.baseTypeArray.length; ++i) {
            if (_typeStr === this.baseTypeArray[i].dataType) {
                return this.baseTypeArray[i];
            }
        }
    }

    GetDataTypeOptions() {
        let typeStrArr = [];
        for (let i = 0; i < this.baseTypeArray.length; ++i) {
            typeStrArr.push(this.baseTypeArray[i].dataType);
        }
        return typeStrArr;
    }

    getBaseTypeVariable() {
        let variable = DeepCopy(this.baseTypeArray[0]);
        variable.assignUniqueId();
        return variable;
    }

    toJsonData() {
        let structArr = [];

        for (let i = 0; i < this.baseTypeArray.length; ++i) {
            if (this.baseTypeArray[i] instanceof M_Struct) {
                structArr.push(this.baseTypeArray[i].toJsonData());
            }
        }

        return structArr;
    }
}

//--------------------------------------------------------------------------

class G_Widget extends M_Object {
    SvgPadding = 5;
    fontFamily = "Cambria";

    constructor(_classparent, _parent, _x, _y, _width, _height) {
        super();

        this.classparent = _classparent;
        this.parent = _parent;
        this.x = _x;
        this.y = _y;
        this.width = _width;
        this.height = _height;

        this.innerwidth = this.width - this.SvgPadding * 2;
        this.innerheight = this.height - this.SvgPadding * 2;

        // if(this.classparent && !this.classparent.children){
        //     console.log(this.classparent);
        // }

        if (this.classparent && this.classparent.children) {
            this.classparent.children.push(this);
        }
    }

    selfAdjustFontSizeAndY() {
        let fontsize = 0;

        var tmptext = CreateSVG("text", { style: "font-family:" + this.fontFamily, "font-size": 1 });
        tmptext.innerHTML = " ";

        this.svg.appendChild(tmptext);

        while (tmptext.getBBox().height <= this.innerheight) {
            $(tmptext).attr("font-size", ++fontsize);
        }
        $(this.text).attr("font-size", --fontsize);

        this.fontSize = fontsize;
        this.textY = -tmptext.getBBox().y - 1;

        $(this.text).attr("y", this.textY);

        $(tmptext).remove();
    }

    updateInner() {
        this.innerwidth = this.width - this.SvgPadding * 2;
        this.innerheight = this.height - this.SvgPadding * 2;
    }

    updateOutter() {
        this.width = this.innerwidth + this.SvgPadding * 2;
        this.height = this.innerheight + this.SvgPadding * 2;
    }

    updateLayout() {
        $(this.svg).attr("width", this.width);
        $(this.svg).attr("height", this.height);

        $(this.back).attr("width", this.width);
        $(this.back).attr("height", this.height);

        $(this.innersvg).attr("x", this.SvgPadding);
        $(this.innersvg).attr("y", this.SvgPadding);

        $(this.innersvg).attr("width", this.innerwidth);
        $(this.innersvg).attr("height", this.innerheight);

        $(this.innerback).attr("width", this.innerwidth);
        $(this.innerback).attr("height", this.innerheight);
    }

    destroy() {
        let childrenWidgets = this.children;
        if (this.terminalWidget) {
            childrenWidgets = this.terminalWidget.children;
        }

        if (childrenWidgets) {
            for (let i = childrenWidgets.length - 1; i >= 0; --i) {
                childrenWidgets[i].destroy();
            }
        }

        // console.log(this);
        // console.log(this.children);

        if (this.svg) {
            try {
                this.parent.removeChild(this.svg);
            } catch (error) {
                if(!this instanceof G_Struct_Variable_Field_Widget){
                    console.error(this);
                    console.error(error);
                }
            }

            // this.parent.removeChild(this.svg);

            // this.parent.removeChild(this.svg);
            //$(this.svg).remove();

            if (this.classparent) {
                this.classparent.children.remove(this);
                this.classparent.updateGUI();
            }
        } else {
            console.log("Destroy failed!!");
        }
    }
}

class G_Terminal_Widget extends G_Widget {
    terminalWidget = null;

    constructor(_parent, _x, _y) {
        super(null, _parent, _x, _y, 30, 30);

        // this.SvgPadding = 4;
        this.innerwidth = this.width - this.SvgPadding * 2;
        this.innerheight = this.height - this.SvgPadding * 2;

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height, ondragstart: "return false;" });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight, "pointer-events": "none" });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: "#000", opacity: 0.3, rx: 10 });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: "transparent" });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);
    }

    updateGUI() {
        if (this.terminalWidget) {

            this.terminalWidget.applyAlignment();

            this.innerwidth = this.terminalWidget.width;
            this.innerheight = this.terminalWidget.height;

            this.updateOutter();
            this.updateLayout();
        }
    }

    getConnectors(parentWidget) {
        let arr = [];
        if (parentWidget && parentWidget.children && parentWidget.children.length > 0) {
            for (let i = 0; i < parentWidget.children.length; ++i) {
                if (parentWidget.children[i] instanceof G_Connectable_Widget) {
                    arr.push(parentWidget.children[i]);
                } else {
                    arr.push(...this.getConnectors(parentWidget.children[i]));
                }
            }
        }
        return arr;
    }

    getAllConnectors() {
        let ConnectableWidgetArray = [];
        ConnectableWidgetArray = this.getConnectors(this.terminalWidget);
        return ConnectableWidgetArray;
    }
}

class G_Layout_Widget extends G_Widget {
    children = [];

    constructor(_classparent, _align, _color) {
        super(_classparent, _classparent.innersvg, 0, 0, 30, 30);

        this.SvgPadding = 1;//3
        this.innerwidth = this.width - this.SvgPadding * 2;
        this.innerheight = this.height - this.SvgPadding * 2;

        if (_align) {
            this.align = _align;
        }

        if (_color) {
            this.color = _color;
            console.log(this.color);
        } else {
            this.color = "transparent";
        }

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: getRandomColor() });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: getRandomColor() });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);
    }
}

class G_Horizontal_Layout extends G_Layout_Widget {
    constructor(_classparent, _align, _color) {
        super(_classparent, _align, _color);
    }

    updateGUI(dontBubble) {
        var heightArr = [0];

        this.children.forEach(child => {
            heightArr.push(child.height);
        });

        this.innerheight = Math.max(...heightArr);

        let nextX = 0;
        this.children.forEach(child => {
            child.x = nextX;
            $(child.svg).attr("x", child.x);
            nextX += child.width;
        });


        this.innerwidth = nextX;

        this.updateOutter();
        this.updateLayout();

        if (dontBubble != true) {
            this.classparent.updateGUI();
        }
    }

    applyAlignment() {
        if (this instanceof G_Layout_Widget === true) {

            var heightArr = [0];

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.updateGUI(true);
                }
                heightArr.push(child.height);
            });

            this.innerheight = Math.max(...heightArr);
            this.updateOutter();
            this.updateLayout();

            var leftX = 0;
            var rightX = this.innerwidth;

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.height = this.innerheight;
                    child.updateInner();
                    child.updateLayout();

                    if (child.align === "right") {
                        rightX -= child.width
                        child.x = rightX;
                        $(child.svg).attr("x", child.x);
                    } else if (child.align === "middle") {
                        child.x = (this.innerwidth - child.width) / 2;
                        $(child.svg).attr("x", child.x);
                    } else {
                        child.x = leftX;
                        $(child.svg).attr("x", child.x);
                        leftX += child.width;
                    }
                } else {
                    child.x = leftX;
                    $(child.svg).attr("x", child.x);
                    leftX += child.width;
                }
            });

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.applyAlignment();
                }
            });
        }
    }
}

class G_Vertical_Layout extends G_Layout_Widget {
    constructor(_classparent, _align, _color) {
        super(_classparent, _align, _color);
    }

    updateGUI(dontBubble) {
        var widthArr = [0];

        this.children.forEach(child => {
            if (child.ignore != true) {
                widthArr.push(child.width);
            }
        });

        this.innerwidth = Math.max(...widthArr);

        //------------------
        let nextY = 0;
        this.children.forEach(child => {
            if (child.ignore != true) {
                child.y = nextY;
                $(child.svg).attr("y", child.y);
                nextY += child.height;
            }
        });
        this.innerheight = nextY;

        this.updateOutter();
        this.updateLayout();

        if (dontBubble != true) {
            this.classparent.updateGUI();
        }
    }

    applyAlignment() {
        if (this instanceof G_Layout_Widget === true) {

            var widthArr = [0];

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.updateGUI(true);
                }
                widthArr.push(child.width);
            });

            this.innerwidth = Math.max(...widthArr);

            this.updateOutter();
            this.updateLayout();

            var topY = 0;
            var bottomY = this.innerheight;

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.width = this.innerwidth;
                    child.updateInner();
                    child.updateLayout();

                    if (child.align === "bottom") {
                        bottomY -= child.height
                        child.y = bottomY;
                        $(child.svg).attr("y", child.y);
                    } else if (child.align === "center") {
                        child.y = (this.innerheight - child.height) / 2;
                        $(child.svg).attr("y", child.y);
                    } else {
                        child.y = topY;
                        $(child.svg).attr("y", child.y);
                        topY += child.height;
                    }
                } else {
                    child.y = topY;
                    $(child.svg).attr("y", child.y);
                    topY += child.height;
                }
            });

            this.children.forEach(child => {
                if (child instanceof G_Layout_Widget === true) {
                    child.applyAlignment();
                }
            });
        }
    }
}

class G_Empty_Widget extends G_Widget {
    constructor(_classparent, _width, _height) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height);

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: "transparent" });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
    }

    updateGUI() {
        $(this.svg).attr("width", this.width);
        $(this.svg).attr("height", this.height);
        $(this.back).attr("width", this.width);
        $(this.back).attr("height", this.height);
        this.classparent.updateGUI();
    }
}

class G_Check_Box extends G_Widget {
    flagCallback = null;
    checked = false;

    constructor(_classparent, _width, _height, _checked) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height);

        this.checked = _checked;

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height, "pointer-events": "auto" });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: "#339FFF" });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: "white" });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);

        this.text = CreateSVG("text", { style: "font-family:" + this.fontFamily, fill: "#000000" });

        this.innersvg.appendChild(this.text);

        this.svg.belongClass = this;
        this.svg.addEventListener("click", function (e) {
            this.belongClass.click(e);
        });

        this.updateGUI();
        this.selfAdjustFontSizeAndY();

        this.svg.addEventListener("mousedown", function (e) {
            e.stopPropagation();
        });

        this.svg.addEventListener("mouseup", function (e) {
            e.stopPropagation();
        });
        this.svg.addEventListener("mousemove", function (e) {
            e.stopPropagation();
        });
    }

    setChecked(_flag) {
        this.checked = _flag;
        this.updateGUI();
    }

    click(e) {
        this.checked = !this.checked;
        this.updateGUI();
    }

    updateGUI() {
        if (this.flagCallback) {
            this.flagCallback(this.checked);
        }
        if (this.checked === true) {
            $(this.text).html("*");
        } else {
            $(this.text).html("");
        }
    }
}

class G_Plain_Text extends G_Widget {
    constructor(_classparent, _width, _height, _text) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height);

        this.string = _text;

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: "#339FFF" });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: "white" });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);

        this.text = CreateSVG("text", { style: "font-family:" + this.fontFamily, fill: "#000000" });
        this.text.innerHTML = this.string;
        this.innersvg.appendChild(this.text);

        this.selfAdjustFontSizeAndY();
        // this.textAlignCenter();
    }

    updateGUI() {
        const textWidth = this.text.getBBox().width;
        this.innerwidth = textWidth;
        this.width = this.innerwidth + this.SvgPadding * 2;

        $(this.svg).attr("width", this.width);
        $(this.back).attr("width", this.width);
        $(this.innersvg).attr("width", this.innerwidth);
        $(this.innerback).attr("width", this.innerwidth);

        this.classparent.updateGUI();
    }

    setString(str) {
        this.text.innerHTML = this.string = str;
        // this.updateGUI();
    }

    updateText() {
        this.text.innerHTML = this.string;
        // this.textAlignCenter();
    }

    selfAdjustFontSizeAndY() {
        let fontsize = 0;

        var tmptext = CreateSVG("text", { style: "font-family:" + this.fontFamily, "font-size": 1 });
        tmptext.innerHTML = " ";

        this.svg.appendChild(tmptext);

        while (tmptext.getBBox().height <= this.innerheight) {
            $(tmptext).attr("font-size", ++fontsize);
        }
        $(this.text).attr("font-size", --fontsize);

        this.fontSize = fontsize;
        this.textY = -tmptext.getBBox().y - 1;

        $(this.text).attr("y", this.textY);

        $(tmptext).remove();
    }

    textAlignCenter() {
        $(this.text).attr("x", (this.innerwidth - this.text.getBBox().width) / 2.0);
    }

    textAlignLeft() {
        $(this.text).attr("x", 0);
    }
}

class G_Text_Input extends G_Widget {
    bFocus = false;
    bPressed = false;
    bShowCursor = false;

    cursorIndex = 0;

    startCursorIndex = 0;
    endCursorIndex = 0;

    historyRecords = [];

    changeHandler = null;

    constructor(_classparent, _width, _height, _text) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height, _text);

        this.string = _text;

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height, "pointer-events": "auto" });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight });

        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: "#339CFF" });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: "white" });

        this.outline = CreateSVG("rect", { width: this.width, height: this.height, fill: "none", stroke: "#339FFF", "stroke-width": 2, "pointer-events": "none" });
        this.select = CreateSVG("rect", { width: 0, height: this.innerheight, fill: "#CCE6FF", "fill-opacity": "0.6", "pointer-events": "none" });

        this.faketext = CreateSVG("text", { style: "font-family:" + this.fontFamily });
        this.faketext.innerHTML = " ";

        this.group = CreateSVG("svg", { width: this.width, height: this.height });

        this.text = CreateSVG("text", { style: "font-family:" + this.fontFamily, fill: "#000000" });
        this.text.innerHTML = this.string;
        this.cursorIndex = this.string.length;

        this.line = CreateSVG("line", { x1: 0, x2: 0, y1: 0, y2: this.innerheight, stroke: "black", "shape-rendering": "crispEdges", "display": "none", "pointer-events": "none" });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.faketext);

        $(this.faketext).attr("y", this.faketext.getBBox().height);

        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);

        this.innersvg.appendChild(this.innerback);
        this.innersvg.appendChild(this.group);

        this.group.appendChild(this.text);
        this.group.appendChild(this.select);
        this.group.appendChild(this.line);

        this.svg.appendChild(this.outline);

        this.svg.outer = this;

        this.selfAdjustFontSizeAndY();
        this.updateGUI();

        this.svg.addEventListener("dblclick", function (e) {
            e.stopPropagation();
            this.outer.dblclick(e);
        });

        this.svg.addEventListener("mousedown", function (e) {
            e.stopPropagation();
            this.outer.mousedown(e);
        });

        this.svg.addEventListener("mouseup", function (e) {
            e.stopPropagation();
            this.outer.mouseup(e);
        });

        this.svg.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        this.svg.addEventListener("mousemove", function (e) {
            e.stopPropagation();
            this.outer.mousemove(e);
        });

        this.svg.addEventListener("copy", function (e) {
            e.stopPropagation();
            this.outer.copy(e);
        });

        this.svg.addEventListener("cut", function (e) {
            this.outer.cut(e);
        });

        this.svg.addEventListener("paste", function (e) {
            this.outer.paste(e);
        });

        this.svg.addEventListener('focus', function (e) {
            e.stopPropagation();
            this.outer.focus(e);
        });

        this.svg.addEventListener('keydown', function (e) {
            e.stopPropagation();
            this.outer.keydown(e);
        });

        this.svg.addEventListener('blur', function (e) {
            e.stopPropagation();
            this.outer.blur(e);
        });
    }

    setString(str) {
        this.text.innerHTML = this.string = str;
        this.updateGUI();
    }

    //events

    dblclick(e) {
        this.startCursorIndex = 0;
        this.endCursorIndex = this.string.length;
        this.updateGUI();
    }

    getBaseXY() {
        var child = this;
        var x = 0;
        var y = 0;

        while (child) {
            if (child.innersvg) {
                x += child.SvgPadding;
                y += child.SvgPadding;
            }
            x += parseFloat($(child.svg).attr("x"));
            y += parseFloat($(child.svg).attr("y"));
            child = child.classparent;
        }

        return { x: x, y: y };
    }

    mousedown(e) {
        var baseX = this.getBaseXY().x;
        this.bPressed = true;
        this.bShowCursor = true;

        var groupX = this.validateFloat(parseFloat($(this.group).attr("x")));
        var ContainerX = e.offsetX - groupX - baseX;

        this.updateCursorIndexsByContainerX(ContainerX);
        this.updateGUI();
    }

    mousemove(e) {
        if (this.bPressed === true) {
            var baseX = this.getBaseXY().x;
            var groupX = this.validateFloat(parseFloat($(this.group).attr("x")));
            var ContainerX = e.offsetX - groupX - baseX;

            this.endCursorIndex = this.getAppropriateIndex(ContainerX);

            this.updateGUI();

            var winX = ContainerX + groupX;
            var newx = 0;

            if (winX < 0) {
                if (groupX + Math.abs(winX) <= 0) {
                    newx = groupX + Math.abs(winX);
                } else {
                    newx = 0;
                }
                $(this.group).attr("x", newx);
            } else if (winX > this.innerwidth) {
                if (this.text.getBBox().width > this.innerwidth) {
                    if (groupX - (winX - this.innerwidth) >= this.innerwidth - this.text.getBBox().width) {
                        newx = groupX - Math.abs(winX - this.innerwidth);
                    } else {
                        newx = this.innerwidth - this.text.getBBox().width;
                    }
                    $(this.group).attr("x", newx);
                }
            }

        }
    }

    mouseup(e) {
        this.bPressed = false;
    }

    copy(e) {
        var copyText = this.string.substring(this.startCursorIndex, this.endCursorIndex);
        e.clipboardData.setData('text/plain', copyText);
        e.preventDefault();
    }

    cut(e) {
        var cutText = this.string.substring(this.startCursorIndex, this.endCursorIndex);
        e.clipboardData.setData('text/plain', cutText);

        this.tryRemoveStringByIndex();
        this.updateGUI();

        e.preventDefault();
    }

    paste(e) {
        var pasteText = e.clipboardData.getData("text/plain")
        if (pasteText === "") {
            return;
        }

        this.AddChar(pasteText);
        this.updateGUI();

        e.preventDefault();
    }

    focus(e) {
        $(this.outline).attr("stroke", "#FF5E33");
        this.bFocus = true;
        this.updateGUI();
    }

    keydown(e) {
        if (this.bFocus === true) {
            let KeyText = e.key;

            if (e.ctrlKey === true) {
                this.ctrlKeyOperation(e, KeyText);
            } else if (e.shiftKey === true && (KeyText === "ArrowLeft" || KeyText === "ArrowRight")) {
                this.shiftKeyOperation(KeyText);
            } else {
                e.preventDefault();
                switch (KeyText) {
                    case "Backspace":
                        this.backSpace();
                        return;
                        break;
                    case "Enter":
                        this.change();
                        break;
                    case "Control":
                    case "Shift":
                    case "CapsLock":
                        return;
                    case "ArrowLeft":
                        if (this.hasSelection()) {
                            this.startCursorIndex = this.endCursorIndex = this.cursorIndex = Math.min(this.startCursorIndex, this.endCursorIndex);
                        } else {
                            this.startCursorIndex = this.endCursorIndex = --this.cursorIndex;
                        }
                        this.updateGUI();
                        break;
                    case "ArrowRight":
                        if (this.hasSelection()) {
                            this.startCursorIndex = this.endCursorIndex = this.cursorIndex = Math.max(this.startCursorIndex, this.endCursorIndex);
                        } else {
                            this.startCursorIndex = this.endCursorIndex = ++this.cursorIndex;
                        }
                        this.updateGUI();
                        break;
                }
                if (KeyText.length === 1) {
                    this.AddChar(KeyText);
                    this.updateGUI();
                }
            }
        }
    }

    blur(e) {
        $(this.outline).attr("stroke", "#339FFF");
        this.bFocus = false;
        this.change();
    }

    change() {
        this.validateData();
        this.historyRecords = [];
        this.bPressed = false;

        this.startCursorIndex = this.endCursorIndex;
        this.updateGUI();

        if (this.changeHandler) {
            this.changeHandler();
        }
    }

    //--

    toggleCursorDisplay() {
        if (this.bFocus === true) {
            if ($(this.line).attr("display") === "block") {
                $(this.line).attr("display", "none");
            } else if (this.bShowCursor === true) {
                $(this.line).attr("display", "block");
            }

            this.timerhandler = setTimeout(() => {
                this.toggleCursorDisplay();
            }, 500);
        } else {
            $(this.line).attr("display", "none");
        }
    }

    validateData() {

    }

    validateFloat(val) {
        return isNaN(val) ? 0.0 : val;
    }

    updateCursorIndexsByContainerX(ContainerX) {
        let index = this.getAppropriateIndex(ContainerX);
        if (index < 0) {
            index = 0;
        } else if (index > this.string.length) {
            index = this.string.length;
        }

        this.startCursorIndex = this.endCursorIndex = this.cursorIndex = index;
    }

    getAppropriateIndex(ContainerX) {
        let i = 0;

        for (i = 0; i < this.string.length; ++i) {
            let str = this.string.substring(0, i);
            let strWidth = this.getTextBBoxWidth(str);

            if (strWidth > ContainerX) {
                break;
            }
        }

        const LeftCursorIndex = i - 1;
        const RightCursorIndex = i;

        const LeftCursorX = this.getTextBBoxWidth(this.string.substring(0, LeftCursorIndex));
        const RightCursorX = this.getTextBBoxWidth(this.string.substring(0, RightCursorIndex));

        const leftDelta = Math.abs(ContainerX - LeftCursorX);
        const rightDelta = Math.abs(RightCursorX - ContainerX);

        if (leftDelta < rightDelta) {
            return LeftCursorIndex;
        } else {
            return RightCursorIndex;
        }

    }

    getTextBBoxWidth(str) {
        var tmptext = CreateSVG("text", { style: "font-family:" + this.fontFamily, "font-size": parseInt($(this.text).attr("font-size")) });
        $(tmptext).html(str);

        this.svg.appendChild(tmptext);

        var len = tmptext.getBBox().width;
        $(tmptext).remove();

        return len;
    }

    hasSelection() {
        if (this.startCursorIndex === this.endCursorIndex) {
            return false;
        } else {
            return true;
        }
    }

    correctIndexs() {
        if (this.cursorIndex < 0) {
            this.cursorIndex = 0;
        } else if (this.cursorIndex > this.string.length) {
            this.cursorIndex = this.string.length;
        }

        if (this.startCursorIndex < 0) {
            this.startCursorIndex = 0;
        } else if (this.startCursorIndex > this.string.length) {
            this.startCursorIndex = this.string.length;
        }

        if (this.endCursorIndex < 0) {
            this.endCursorIndex = 0;
        } else if (this.endCursorIndex > this.string.length) {
            this.endCursorIndex = this.string.length;
        }
    }

    updateStringAndGroupWidth() {
        if (this.string === "") {
            this.text.innerHTML = " ";
        } else {
            this.text.innerHTML = this.string;
        }

        var newWidth = this.text.getBBox().width;
        $(this.group).attr("width", newWidth + 10);
    }

    updateCursorX() {
        var x = this.getTextBBoxWidth(this.string.substring(0, this.cursorIndex))
        var groupX = this.validateFloat(parseFloat($(this.group).attr("x")));

        if (x + groupX - 0.5 <= 0) {
            x += 1;
        } else if (x + 0.5 >= this.text.getBBox().width) {
            x -= 1;
        }

        $(this.line).attr("x1", x);
        $(this.line).attr("x2", x);
    }

    updateCursorVisibility() {
        if (this.hasSelection()) {
            this.bShowCursor = false;
        } else {
            this.bShowCursor = true;
        }

        if (this.timerhandler) {
            clearTimeout(this.timerhandler);
        }

        if (this.bFocus === true && this.bShowCursor === true) {
            $(this.line).attr("display", "block");

            this.timerhandler = setTimeout(() => {
                this.toggleCursorDisplay();
            }, 500);
        } else {
            $(this.line).attr("display", "none");
        }
    }

    updateGroupX() {
        var textWidth = this.text.getBBox().width;
        var CursorPreWidth = this.getTextBBoxWidth(this.string.substring(0, this.cursorIndex));

        var groupX = this.validateFloat(parseFloat($(this.group).attr("x")));

        var ContainerX = groupX + CursorPreWidth;


        if (ContainerX < 0) {
            $(this.group).attr("x", -CursorPreWidth);
        } else if (ContainerX > this.innerwidth) {
            $(this.group).attr("x", (this.innerwidth - CursorPreWidth));
        }

        var TextContainerWidth = textWidth + groupX;

        if (textWidth >= this.innerwidth) {
            if (TextContainerWidth < this.innerwidth) {
                $(this.group).attr("x", (this.innerwidth - textWidth));
            }
        } else {
            $(this.group).attr("x", 0);
        }
    }

    updateSelection() {
        const startX = this.getTextBBoxWidth(this.string.substring(0, this.startCursorIndex));
        const endX = this.getTextBBoxWidth(this.string.substring(0, this.endCursorIndex));

        var x = Math.min(startX, endX);
        var w = Math.max(startX, endX) - x;

        $(this.select).attr("x", x);
        $(this.select).attr("width", w);
    }

    updateGUI() {
        this.correctIndexs();
        this.updateStringAndGroupWidth();
        this.updateGroupX();
        this.updateCursorX();
        this.updateCursorVisibility();
        this.updateSelection();
    }

    backSpace() {
        if (this.hasSelection()) {
            this.tryRemoveStringByIndex();
        } else {
            this.RemoveChar();
        }
        this.updateGUI();
    }

    ctrlKeyOperation(e, KeyText) {
        switch (KeyText) {
            case "a":
                this.startCursorIndex = 0;
                this.endCursorIndex = this.string.length;
                this.updateGUI();
                e.preventDefault();
                break;
            case "z":
                this.unDo();
                this.updateGUI();
                e.preventDefault();
                break;
        }

    }

    shiftKeyOperation(KeyText) {
        switch (KeyText) {
            case "ArrowLeft":
                --this.endCursorIndex;
                this.cursorIndex = this.endCursorIndex;
                this.updateGUI();
                break;
            case "ArrowRight":
                ++this.endCursorIndex;
                this.cursorIndex = this.endCursorIndex;
                this.updateGUI();
                break;
        }
    }

    AddChar(char) {
        this.historyRecords.push({ string: this.string, cursorIndex: this.cursorIndex });
        this.tryRemoveStringByIndex();
        this.string = this.string.addCharAfter(this.cursorIndex, char);
        this.startCursorIndex = this.endCursorIndex = this.cursorIndex += char.length;
    }

    RemoveChar() {
        if (this.cursorIndex > 0) {
            this.historyRecords.push({ string: this.string, cursorIndex: this.cursorIndex });
            this.string = this.string.removeCharAt(--this.cursorIndex);
        }
    }

    tryRemoveStringByIndex() {
        if (this.startCursorIndex === this.endCursorIndex) {
            return;
        }
        this.historyRecords.push({ string: this.string, cursorIndex: this.cursorIndex });
        const leftIndex = Math.min(this.startCursorIndex, this.endCursorIndex);
        const rightIndex = Math.max(this.startCursorIndex, this.endCursorIndex);

        var leftpart = this.string.substring(0, leftIndex);
        var rightpart = this.string.substring(rightIndex);

        this.string = (leftpart + rightpart);
        this.startCursorIndex = this.endCursorIndex = this.cursorIndex = leftIndex;

        this.startCursorX = this.endCursorX = 0;
    }

    unDo() {
        const record = this.historyRecords.pop();
        if (record) {
            const string = record["string"];
            const cursorIndex = record["cursorIndex"];

            this.string = string;
            this.startCursorIndex = this.endCursorIndex = this.cursorIndex = cursorIndex;
        }
    }
}

class G_Plain_Text_Button extends G_Plain_Text {
    mousedownHandler = null;
    clickHandler = null;

    NormalColor = "#AAAAAA";
    InReleasedColor = "#FFAA00";
    InPressedColor = "#D68F00";

    constructor(_classparent, _width, _height, _text) {
        super(_classparent, _width, _height, _text);

        // this.SvgPadding = 0;

        // this.updateInner();
        // this.updateLayout();
        $(this.svg).attr("pointer-events", "auto");
        this.svg.belongClass = this;

        this.svg.addEventListener("mousedown", function (e) {
            e.stopPropagation();
            this.belongClass.mousedown(e);
        });

        this.svg.addEventListener("mouseup", function (e) {
            e.stopPropagation();
        });

        this.svg.addEventListener("click", function (e) {
            e.stopPropagation();
            this.belongClass.click(e);
        });
    }

    mousedown(e) {
        if (this.mousedownHandler) {
            this.mousedownHandler(e);
        }
    }

    click(e) {
        if (this.clickHandler) {
            this.clickHandler(e);
        }
    }

    updateGUI() {
        this.updateText();
    }
}

class G_Text_Button extends G_Plain_Text {
    mousedownHandler = null;
    clickHandler = null;

    DisabledColor = "Gray";

    NormalColor = "#AAAAAA";
    InReleasedColor = "#FFAA00";
    InPressedColor = "#D68F00";

    bEnabled = true;

    constructor(_classparent, _width, _height, _text) {
        super(_classparent, _width, _height, _text);

        // this.SvgPadding = 0;

        this.updateInner();
        this.updateLayout();

        this.selfAdjustFontSizeAndY();
        this.textAlignCenter();

        $(this.back).attr("fill", this.InPressedColor);
        $(this.back).attr("pointer-events", "auto");

        $(this.innerback).attr("fill", this.NormalColor);
        this.svg.outer = this;

        this.svg.addEventListener("mousedown", function (e) {
            e.stopPropagation();
            this.outer.mousedown(e);
        });

        this.svg.addEventListener("mouseup", function (e) {
            e.stopPropagation();
            this.outer.mouseup(e);
        });

        this.svg.addEventListener("mouseenter", function (e) {
            e.stopPropagation();
            this.outer.mouseenter(e);
        });

        this.svg.addEventListener("mouseleave", function (e) {
            e.stopPropagation();
            this.outer.mouseleave(e);
        });

        this.svg.addEventListener("click", function (e) {
            e.stopPropagation();
            this.outer.click(e);
        });
    }

    setString(str) {
        this.text.innerHTML = this.string = str;
        this.updateGUI();
    }

    setEnabled(flag) {
        this.bEnabled = flag;

        if (this.bEnabled === true) {
            $(this.back).attr("fill", this.InPressedColor);
            $(this.innerback).attr("fill", this.NormalColor);
        } else if (this.bEnabled === false) {
            $(this.back).attr("fill", this.DisabledColor);
            $(this.innerback).attr("fill", this.DisabledColor);
        }
    }

    mousedown(e) {
        if (this.bEnabled === false) {
            return;
        }
        $(this.innerback).attr("fill", this.InPressedColor);
        $(this.innersvg).attr("y", this.SvgPadding + 2);

        if (this.mousedownHandler) {
            this.mousedownHandler(e);
        }
    }

    mouseup(e) {
        if (this.bEnabled === false) {
            return;
        }
        $(this.innerback).attr("fill", this.InReleasedColor);
        $(this.innersvg).attr("y", this.SvgPadding);
    }

    mouseenter(e) {
        if (this.bEnabled === false) {
            return;
        }
        $(this.innerback).attr("fill", this.InReleasedColor);
    }

    mouseleave(e) {
        if (this.bEnabled === false) {
            return;
        }
        $(this.innerback).attr("fill", this.NormalColor);
        $(this.innersvg).attr("y", this.SvgPadding);
    }

    click(e) {
        if (this.bEnabled === false) {
            return;
        }
        if (this.clickHandler) {
            this.clickHandler(e);
        }
    }

    updateGUI() {
        this.text.innerHTML = this.string;
        this.textAlignCenter();
    }
}

class G_Text_Option extends G_Plain_Text_Button {
    constructor(_classparent, _width, _height, _dataType) {
        super(_classparent, _width, _height);

        this.string = this.dataType = _dataType;

        this.updateGUI();

        this.svg.addEventListener('mouseenter', function (e) {
            e.stopPropagation();
            this.belongClass.mouseenter(e);
        });

        this.svg.addEventListener('mouseleave', function (e) {
            e.stopPropagation();
            this.belongClass.mouseleave(e);
        });

    }

    mouseenter(e) {
        $(this.back).attr("fill", "red");
    }

    mouseleave(e) {
        $(this.back).attr("fill", "#339FFF");
    }

    mousedown(e) {
        this.classparent.selectOption(this.dataType);
    }
}

class G_Text_Selected_Option extends G_Plain_Text_Button {
    constructor(_classparent, _width, _height,) {
        super(_classparent, _width, _height);

        this.string = "null";

        this.clickHandler = this.toggleSelector;

        this.updateGUI();

        this.svg.addEventListener('blur', function (e) {
            e.stopPropagation();
            this.belongClass.toggleSelector(false);
        });
    }

    toggleSelector(_bDrop) {
        $(this.svg).attr("pointer-events", "none");
        if (_bDrop === true || _bDrop === false) {
            this.classparent.bDropped = _bDrop;
        } else {
            this.classparent.bDropped = !this.classparent.bDropped;
        }

        this.classparent.optionWidgets.forEach(opt => {
            if (this.classparent.bDropped === true) {
                opt.ignore = false;
            } else {
                opt.ignore = true;
            }
        });

        this.classparent.updateGUI();

        let that = this;

        setTimeout(() => {
            $(that.svg).attr("pointer-events", "auto");
        }, 100);

    }
}

class G_Text_Select extends G_Vertical_Layout {
    bDropped = true;

    typeOptions = [];
    textSelectedOption = null;
    optionWidgets = [];

    constructor(_classparent) {
        super(_classparent);
        this.updateTypeOptions();
    }

    updateData(_data) {
        this.textSelectedOption.setString(_data.dataType);
        this.textSelectedOption.toggleSelector(false);
    }

    updateTypeOptions() {
        this.typeOptions = TypeManager.GetDataTypeOptions();
        if (this.textSelectedOption) {
            for (let i = this.children.length - 1; i >= 0; --i) {
                this.children[i].destroy();
            }
        }

        this.textSelectedOption = new G_Text_Selected_Option(this, 65, 30);

        for (let i = 0; i < this.typeOptions.length; ++i) {
            // if (this.classparent.data.dataType === this.typeOptions[i] || this.classparent.classparent.data && this.classparent.classparent.data.dataType === this.typeOptions[i]) {
            //     continue
            // }

            if (this.classparent.data.dataType === this.typeOptions[i]) {
                continue
            }

            var textoption = new G_Text_Option(this, 65, 30, this.typeOptions[i]);
            this.optionWidgets.push(textoption);
        }

        this.updateGUI();
    }

    selectOption(mType) {
        this.classparent.data.selectDataType(mType);
    }
}

class G_Icon_Widget extends G_Widget {
    constructor(_classparent, _width, _height) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height);

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: getRandomColor() });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: getRandomColor() });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);

        this.icon = CreateSVG("circle", { cx: this.innerwidth / 2, cy: this.innerheight / 2, r: this.innerheight / 2 - 6, fill: "transparent", "stroke-width": 6, stroke: "#FFFFFF" });
        this.innersvg.appendChild(this.icon);
    }

    setIcon(name) {
        var thickness = this.innerheight / 8;
        $(this.innersvg).empty();
        switch (name) {
            case "+":
                var part1 = CreateSVG("rect", { y: this.innerheight / 2 - thickness / 2, width: this.innerwidth, height: thickness, fill: "black" });
                var part2 = CreateSVG("rect", { x: this.innerwidth / 2 - thickness / 2, width: thickness, height: this.innerheight, fill: "black" });

                this.innersvg.appendChild(part1);
                this.innersvg.appendChild(part2);
                break;
            case "-":
                var part1 = CreateSVG("rect", { y: this.innerheight / 2 - thickness / 2, width: this.innerwidth, height: thickness, fill: "black" });
                this.innersvg.appendChild(part1);
                break;
            case "*":
                var part1 = CreateSVG("rect", { x: thickness / 2, y: -thickness / 2, width: this.innerwidth * Math.sqrt(2) - thickness, height: thickness, fill: "black", transform: "rotate(45)" });
                var part2 = CreateSVG("rect", { x: this.innerwidth * Math.sqrt(2) / 2 - thickness / 2, y: -(this.innerwidth * Math.sqrt(2) - thickness) / 2, width: thickness, height: this.innerwidth * Math.sqrt(2) - thickness, fill: "black", transform: "rotate(45)" });

                this.innersvg.appendChild(part1);
                this.innersvg.appendChild(part2);
                break;
            case "/":
                var part1 = CreateSVG("rect", { y: this.innerheight / 2 - thickness / 2, width: this.innerwidth, height: thickness, fill: "black" });
                var part2 = CreateSVG("circle", { cx: this.innerwidth / 2, cy: this.innerheight / 2 - thickness * 2, r: thickness, fill: "black" });
                var part3 = CreateSVG("circle", { cx: this.innerwidth / 2, cy: this.innerheight / 2 + thickness * 2, r: thickness, fill: "black" });

                this.innersvg.appendChild(part1);
                this.innersvg.appendChild(part2);
                this.innersvg.appendChild(part3);
                break;
            case "%":
                var part1 = CreateSVG("rect", { x: this.innerwidth * Math.sqrt(2) / 2 - thickness / 2, y: -(this.innerwidth * Math.sqrt(2) - thickness) / 2, width: thickness, height: this.innerwidth * Math.sqrt(2) - thickness, fill: "black", transform: "rotate(45)" });
                var part2 = CreateSVG("circle", { cx: this.innerwidth / 4, cy: this.innerheight / 4, r: thickness, fill: "black" });
                var part3 = CreateSVG("circle", { cx: this.innerwidth / 4 * 3, cy: this.innerheight / 4 * 3, r: thickness, fill: "black" });

                this.innersvg.appendChild(part1);
                this.innersvg.appendChild(part2);
                this.innersvg.appendChild(part3);
                break;
        }
    }
}

//----------

class G_Field_Widget extends G_Horizontal_Layout {
    constructor(_classparent, _data) {
        super(_classparent);

        this.data = _data;
        this.data.addBindingWidget(this);

        $(this.svg).attr("pointer-events", "auto");
        $(this.innersvg).attr("pointer-events", "none");
    }

    delete(e) {
        this.fieldWidget.data.delete();
    }

    // add_M_Field() {
    //     console.log("add_M_Field");
    // }

    // add_G_Field(_data) {
    //     console.log("add_G_Field");
    // }

    updateBindingData(_data) {
        this.data = _data;
    }
}

class G_Draggable_Field_Widget extends G_Field_Widget {
    bMouseDown = false;

    constructor(_classparent, _data) {
        super(_classparent, _data);

        this.svg.belongClass = this;

        this.svg.addEventListener("mousedown", this.mousedown);
        this.svg.addEventListener("mouseup", this.mouseup);
        this.svg.addEventListener("mousemove", this.mousemove);
        this.svg.addEventListener("blur", this.blur);
    }

    mousedown(e) {
        if (e.button != 0) {
            return;
        }
        this.belongClass.bMouseDown = true;
    }

    mouseup(e) {
        this.belongClass.bMouseDown = false;
    }

    mousemove(e) {
        if (this.belongClass.bMouseDown === true) {
            this.belongClass.drag(e);
        }
    }

    blur(e) {
        this.belongClass.bMouseDown = false;
    }

    drag(e) {
        coderoot.top_widget.pendingDragObj = this.data;
        this.bMouseDown = false;
        $(coderoot.code_top_svg).css("display", "block");
        coderoot.top_widget.startShowDragVisualWidget(e.offsetX, e.offsetY);
    }
}

class G_Variable_Field_Widget extends G_Draggable_Field_Widget {
    constructor(_classparent, _data) {
        super(_classparent, _data);

        this.select = new G_Text_Select(this);

        let horWraper22 = new G_Horizontal_Layout(this);
        let horWraper2 = new G_Horizontal_Layout(this);

        this.checkbox = new G_Check_Box(horWraper22, 30, 30, _data.bPointer);

        this.checkbox.flagCallback = function (_flag) {
            console.log(_flag);
            _data.bPointer = _flag;
        };
        this.textInput = new G_Text_Input(horWraper2, 80, 30, " ");

        this.textInput.changeHandler = function (e) {
            this.classparent.classparent.data.setIdentifier(this.string);
        }

        let horWraper3 = new G_Horizontal_Layout(this, "right");
        this.deleteButton = new G_Text_Button(horWraper3, 30, 30, "x");

        this.deleteButton.data = this.data;
        this.deleteButton.clickHandler = function (e) {
            this.data.delete();
        }

        this.updateData(this.data);
        this.svg.addEventListener("mouseenter", this.mouseenter);
    }

    mouseenter(e) {
        this.belongClass.select.updateTypeOptions();
        this.belongClass.updateData();
    }

    updateData() {
        this.select.updateData(this.data);
        this.textInput.setString(this.data.identifier);
    }

    updateBindingData(_data) {
        G_Field_Widget.prototype.updateBindingData.call(this, _data);
        this.updateData();
    }
}

class G_Struct_Variable_Field_Widget extends G_Field_Widget {

    constructor(_classparent, _data) {
        super(_classparent, _data);

        this.select = new G_Text_Select(this);

        let horWraper22 = new G_Horizontal_Layout(this);
        var horWraper2 = new G_Horizontal_Layout(this);

        this.checkbox = new G_Check_Box(horWraper22, 30, 30, _data.bPointer);
        this.checkbox.flagCallback = function (_flag) {
            console.log(_flag);
            _data.bPointer = _flag;
        };

        this.textInput = new G_Text_Input(horWraper2, 80, 30, " ");

        this.textInput.changeHandler = function (e) {
            this.classparent.classparent.data.setIdentifier(this.string);
        }

        var horWraper3 = new G_Horizontal_Layout(this, "right");
        this.deleteButton = new G_Text_Button(horWraper3, 30, 30, "x");

        this.deleteButton.data = this.data;
        this.deleteButton.clickHandler = function (e) {
            this.data.delete();
        }

        this.updateData(this.data);

        this.svg.belongClass = this;
        this.svg.addEventListener("mouseenter", this.mouseenter);
    }

    mouseenter(e) {
        this.belongClass.select.updateTypeOptions();
        this.belongClass.updateData();
    }

    updateData() {
        this.select.updateData(this.data);
        this.textInput.setString(this.data.identifier);
    }

    updateBindingData(_data) {
        G_Field_Widget.prototype.updateBindingData.call(this, _data);
        this.updateData();
    }
}

class G_Function_Field_Widget extends G_Draggable_Field_Widget {
    constructor(_classparent, _data) {
        super(_classparent, _data);

        let horWraper1 = new G_Horizontal_Layout(this);
        this.textButton = new G_Text_Button(horWraper1, 165, 30, " ");
        this.textButton.functionFieldWidget = this;

        this.textButton.clickHandler = function (e) {
            if (coderoot.Current_Function != this.functionFieldWidget.data) {
                if (coderoot.Current_Function) {
                    coderoot.detail_widget.unloadFunction();
                    coderoot.workarea_widget.unloadFunction();
                }

                coderoot.detail_widget.loadFunction(this.functionFieldWidget.data);
                coderoot.workarea_widget.loadFunction(this.functionFieldWidget.data);
            }
        }

        let horWraper2 = new G_Horizontal_Layout(this, "right");
        this.deleteButton = new G_Text_Button(horWraper2, 30, 30, "x");

        this.deleteButton.data = this.data;
        this.deleteButton.clickHandler = function (e) {
            this.data.delete();
        }

        horWraper1.updateGUI();
        horWraper2.updateGUI();

        this.textButton.setString(this.data.name);
    }

    updateBindingData(_data) {
        this.data = _data;
        this.textButton.setString(this.data.name);
    }
}

class G_Operator_Field_Widget extends G_Draggable_Field_Widget {
    constructor(_classparent, _data) {
        super(_classparent, _data);

        var horWraper1 = new G_Horizontal_Layout(this);
        var horWraper2 = new G_Horizontal_Layout(this, "right");
        new G_Plain_Text(horWraper1, 100, 30, this.data.description);
        new G_Plain_Text(horWraper2, 60, 30, this.data.operator);

    }
}

//--------------------------------------------------------------------------

const Connect_Out = 0;
const Connect_In = 1;

const Connect_Exec = 0;
const Connect_Var = 1;

const LeftMouseClick = 0;
const RightMouseClick = 2;

class G_Wire extends G_Widget {
    startPoint = new Vector2D(0, 0);
    endPoint = new Vector2D(500, 500);

    startSlopePoint = new Vector2D(0, 0);
    endSlopePoint = new Vector2D(0, 0);
    slopePoint = new Vector2D(0, 0);
    middlePoint = new Vector2D(0, 0);
    deltaX = 0;
    deltaY = 0;

    activated = true;

    constructor(_classparent, _thickness, _color) {
        super(_classparent, coderoot.code_bottom_svg, 0, 0, 1, 1);

        if (!_thickness) {
            _thickness = 1;
        }
        this.thickness = _thickness;

        if (!_color) {
            _color = "#FFFFFF";
        }
        this.color = _color;

        this.svg = CreateSVG("path", {
            // d: "M10 10 C 50 10, 50 10, 95 80 S 150 150, 180 150",
            d: "",
            stroke: this.color,
            "stroke-width": this.thickness,
            fill: "transparent",
            "pointer-events": "none"
        });
        this.svg.outer = this;

        this.parent.appendChild(this.svg);

        // this.updateGUI();

    }

    reset() {
        if (this.classparent.ConnectDirection === Connect_Out) {
            this.endPoint.x = this.startPoint.x;
            this.endPoint.y = this.startPoint.y;
        } else if (this.classparent.ConnectDirection === Connect_In) {
            this.startPoint.x = this.endPoint.x;
            this.startPoint.y = this.endPoint.y;
        }
        this.updateGUI();
    }

    setStartPos(posXY) {
        if (this.classparent.ConnectDirection === Connect_Out) {
            this.startPoint.x = posXY.x;
            this.startPoint.y = posXY.y;
        } else if (this.classparent.ConnectDirection === Connect_In) {
            this.endPoint.x = posXY.x;
            this.endPoint.y = posXY.y;
        }
    }

    setEndPos(posXY) {
        if (this.classparent.ConnectDirection === Connect_Out) {
            this.endPoint.x = posXY.x;
            this.endPoint.y = posXY.y;
        } else if (this.classparent.ConnectDirection === Connect_In) {
            this.startPoint.x = posXY.x;
            this.startPoint.y = posXY.y;
        }
    }

    updateGUI() {

        var deltaX = this.endPoint.x - this.startPoint.x;
        var deltaY = this.endPoint.y - this.startPoint.y;

        this.slopeLens = deltaX / 4;

        this.middlePoint.x = (this.startPoint.x + this.endPoint.x) / 2;
        this.middlePoint.y = (this.startPoint.y + this.endPoint.y) / 2;

        var extLen = (Math.abs((deltaX)) + Math.abs((deltaY))) / 10;


        this.startSlopePoint.x = this.startPoint.x + extLen;
        this.startSlopePoint.y = this.startPoint.y;

        this.slopePoint.x = this.startPoint.x + extLen * 2;

        this.slopePoint.y = this.startPoint.y;

        this.endSlopePoint.x = this.endPoint.x - extLen;
        this.endSlopePoint.y = this.endPoint.y;

        $(this.svg).attr("d", "M" + this.startPoint.x + " " + this.startPoint.y + " C " + this.startSlopePoint.x + " " + this.startSlopePoint.y + "," + this.slopePoint.x + " " + this.slopePoint.y + "," + this.middlePoint.x + " " + this.middlePoint.y + "S " + this.endSlopePoint.x + " " + this.endSlopePoint.y + "," + this.endPoint.x + " " + this.endPoint.y);
    }

    destroy() {
        console.log(123321);
        G_Widget.prototype.destroy.call(this);
    }
}

class G_Connectable_Widget extends G_Widget {
    CenterX = 0;
    CenterY = 0;

    constructor(_classparent, _width, _height, _color) {
        super(_classparent, _classparent.innersvg, 0, 0, _width, _height);

        if (!_color) {
            _color = "#000"
        }
        this.color = _color;

        this.svg = CreateSVG("svg", { x: this.x, y: this.y, width: this.width, height: this.height, "pointer-events": "auto" });
        this.innersvg = CreateSVG("svg", { x: this.SvgPadding, y: this.SvgPadding, width: this.innerwidth, height: this.innerheight, "pointer-events": "none" });
        this.back = CreateSVG("rect", { width: this.width, height: this.height, fill: getRandomColor() });
        this.innerback = CreateSVG("rect", { width: this.innerwidth, height: this.innerheight, fill: getRandomColor() });

        this.parent.appendChild(this.svg);
        this.svg.appendChild(this.back);
        this.svg.appendChild(this.innersvg);
        this.innersvg.appendChild(this.innerback);

        this.shape = CreateSVG("circle", { cx: this.innerwidth / 2, cy: this.innerheight / 2, r: this.innerheight / 2 - 3, fill: "transparent", "stroke-width": 3, stroke: this.color });
        this.innersvg.appendChild(this.shape);

        this.back.belongClass = this;
        this.shape.belongClass = this;

        this.wire = new G_Wire(this, 3);
        this.connectedWidget = null;
    }

    setConnectable(_flag) {
        if (_flag === true) {
            $(this.svg).attr("pointer-events", "auto");
            $(this.shape).attr("r", this.innerheight / 2 - 3);
            $(this.shape).attr("stroke-width", 3);
            if (this.connectedWidget) {
                this.disconnect();
            }
        } else if (_flag === false) {
            $(this.svg).attr("pointer-events", "none");
            $(this.shape).attr("r", this.innerheight / 2 - 6);
            $(this.shape).attr("stroke-width", 6);
            if (this.connectedWidget) {
                this.disconnect();
            }
        }
    }

    setColor(color) {
        $(this.shape).attr("stroke", color);
    }

    getCenterXY() {
        var child = this;

        var x = child.innerwidth / 2.0;
        var y = child.innerheight / 2.0;

        while (child) {
            if (child.innersvg) {
                x += child.SvgPadding;
                y += child.SvgPadding;
            }
            x += child.x;
            // x += parseFloat($(child.svg).attr("x"));
            y += child.y;
            // y += parseFloat($(child.svg).attr("y"));
            child = child.classparent;

        }

        return { x: x, y: y };
    }

    updateCenterXY() {
        var res = this.getCenterXY();
        this.CenterX = res.x;
        this.CenterY = res.y;
    }

    updateActivatedWire(deltaX, deltaY) {
        if (this.connectedWidget) {
            var wire = null;
            if (this.wire.activated) {
                wire = this.wire;
            } else if (this.connectedWidget.wire.activated) {
                wire = this.connectedWidget.wire;
            }

            if (wire) {
                var posXY = { x: this.CenterX + deltaX, y: this.CenterY + deltaY };

                if (this.ConnectDirection === Connect_Out) {
                    wire.startPoint.x = posXY.x;
                    wire.startPoint.y = posXY.y;
                    wire.updateGUI();
                } else if (this.ConnectDirection === Connect_In) {
                    wire.endPoint.x = posXY.x;
                    wire.endPoint.y = posXY.y;
                    wire.updateGUI();
                }
            }
        }
    }

    connectbegin(e) {
        if (!this.connectedWidget) {
            $(this.shape).attr("fill", "#FFFFFF");

            var posXY = this.getCenterXY();
            this.wire.setStartPos(posXY);
        }
    }

    connecting(e) {
        var child = e.target.belongClass;
        if (child && child instanceof G_Connectable_Widget && child != this) {
            var posXY = child.getCenterXY();
            this.wire.setEndPos(posXY);
        } else {
            var posXY = { x: e.offsetX, y: e.offsetY };
            this.wire.setEndPos(posXY);
        }

        this.wire.updateGUI();
    }

    getDraggableWidget() {
        var parent = this.classparent;
        while (parent.classparent) {
            parent = parent.classparent;
        }

        if (parent instanceof G_Draggable_Widget) {
            return parent;
        }
    }

    addRefToDraggableWidget() {
        var parent = this.getDraggableWidget();
        if (parent) {
            parent.connectedWidgets.push(this);
        }
    }

    removeRefFromDraggableWidget() {
        var parent = this.getDraggableWidget();
        if (parent) {
            parent.connectedWidgets.remove(this);
        }
    }

    connectend(e) {
        var child = e.target.belongClass;
        if (child && child instanceof G_Connectable_Widget && child != this && this.ConnectType === child.ConnectType && this.ConnectDirection != child.ConnectDirection && !this.connectedWidget && !child.connectedWidget) {
            child.wire.activated = false;
            this.connectedWidget = child;
            child.connectedWidget = this;

            $(this.shape).attr("fill", "#FFFFFF");
            $(child.shape).attr("fill", "#FFFFFF");

            this.addRefToDraggableWidget();
            child.addRefToDraggableWidget();
        } else {
            this.wire.reset();
            $(this.shape).attr("fill", "transparent");
        }
    }

    connectTo(child) {
        if (child && child instanceof G_Connectable_Widget && child != this && this.ConnectType === child.ConnectType && this.ConnectDirection != child.ConnectDirection && !this.connectedWidget && !child.connectedWidget) {
            child.wire.activated = false;
            this.connectedWidget = child;
            child.connectedWidget = this;

            $(this.shape).attr("fill", "#FFFFFF");
            $(child.shape).attr("fill", "#FFFFFF");

            this.addRefToDraggableWidget();
            child.addRefToDraggableWidget();
        }
    }

    disconnect() {
        $(this.connectedWidget.shape).attr("fill", "transparent");
        $(this.shape).attr("fill", "transparent");

        this.removeRefFromDraggableWidget();
        this.connectedWidget.removeRefFromDraggableWidget();

        this.wire.reset();
        this.connectedWidget.wire.reset();
        this.wire.activated = true;
        this.connectedWidget.wire.activated = true;
        this.connectedWidget.connectedWidget = null;
        this.connectedWidget = null;
    }

    destroy() {
        this.setConnectable(false);
        // if(this.wire.svg){
        //     console.log(this.wire.svg);
        //     this.wire.destroy();
        // }

        G_Widget.prototype.destroy.call(this);
    }
}

class G_Exec_In_Widget extends G_Connectable_Widget {
    ConnectDirection = Connect_In;
    ConnectType = Connect_Exec;

    constructor(_classparent, _width, _height) {
        super(_classparent, _width, _height);
    }
}

class G_Exec_Out_Widget extends G_Connectable_Widget {
    ConnectDirection = Connect_Out;
    ConnectType = Connect_Exec;

    constructor(_classparent, _width, _height) {
        super(_classparent, _width, _height);
    }
}

class G_Var_In_Widget extends G_Connectable_Widget {
    ConnectDirection = Connect_In;
    ConnectType = Connect_Var;

    constructor(_classparent, _width, _height, _color, _dataWidget) {
        super(_classparent, _width, _height, _color);
        this.dataWidget = _dataWidget;
    }

    getCCode() {
        return this.dataWidget.getDataCCode();
    }
}

class G_Var_Out_Widget extends G_Connectable_Widget {
    ConnectDirection = Connect_Out;
    ConnectType = Connect_Var;

    constructor(_classparent, _width, _height, _color, _dataWidget) {
        super(_classparent, _width, _height, _color);
        this.dataWidget = _dataWidget;
    }

    getCCode() {
        return this.dataWidget.getDataCCode();
    }
}

//--------------------------------------------------------------------------

class G_Variable_In_Field_Widget extends G_Horizontal_Layout {
    constructor(_classparent, _data, _align, _dataWidget) {
        super(_classparent, _align);

        this.data = _data;
        this.data.addBindingWidget(this);

        if (_dataWidget) {
            this.dataWidget = _dataWidget;
        }

        var horWraper = new G_Horizontal_Layout(this);

        var varInWidget = new G_Var_In_Widget(horWraper, 30, 30, this.data.color, this);
        this.varInWidget = varInWidget;
        var variablesIdentiferWidget = new G_Plain_Text(horWraper, 100, 30, this.data.identifier);
        this.variablesIdentiferWidget = variablesIdentiferWidget;

        variablesIdentiferWidget.updateGUI();
    }

    getDataCCode() {
        let ccode = "";
        if (this.dataWidget) {
            ccode += this.dataWidget.getDataCCode();
        }
        ccode += this.data.identifier;
        return ccode;
    }

    updateBindingData(_data) {
        this.data = _data;

        this.varInWidget.setColor(this.data.color);
        this.variablesIdentiferWidget.setString(this.data.identifier);
        this.variablesIdentiferWidget.updateGUI();
    }

    destroy() {
        G_Widget.prototype.destroy.call(this);
        this.data.removeBindingWidget(this);
    }
}

class G_Variable_Out_Field_Widget extends G_Horizontal_Layout {
    constructor(_classparent, _data, _align, _dataWidget) {
        super(_classparent, _align);

        this.data = _data;
        this.data.addBindingWidget(this);

        if (_dataWidget) {
            this.dataWidget = _dataWidget;
        }

        var horWraper = new G_Horizontal_Layout(this, "right");

        var variablesIdentiferWidget = new G_Plain_Text(horWraper, 50, 30, this.data.identifier);
        this.variablesIdentiferWidget = variablesIdentiferWidget;

        var varOutWidget = new G_Var_Out_Widget(horWraper, 30, 30, this.data.color, this);

        this.varOutWidget = varOutWidget;
        variablesIdentiferWidget.updateGUI();
    }

    getDataCCode() {
        let ccode = "";
        if (this.dataWidget) {
            ccode += this.dataWidget.getDataCCode();
            if (!(this.dataWidget instanceof G_CallNode)) {
                if (this.dataWidget.data.bPointer === true) {
                    ccode += "->";
                } else if (this.dataWidget.data.bPointer === false) {
                    ccode += ".";
                }
            }
        }

        if (!(this.dataWidget instanceof G_CallNode)) {
            ccode += this.data.identifier;
        }


        return ccode;
    }

    updateBindingData(_data) {
        this.data = _data;

        this.varOutWidget.setColor(this.data.color);
        this.variablesIdentiferWidget.setString(this.data.identifier);
        this.variablesIdentiferWidget.updateGUI();
    }

    destroy() {
        G_Widget.prototype.destroy.call(this);
        this.data.removeBindingWidget(this);
    }
}

class G_Variable_In_Out_Field_Widget extends G_Horizontal_Layout {
    constructor(_classparent, _data, _align, _dataWidget) {
        super(_classparent, _align);

        this.data = _data;
        this.data.addBindingWidget(this);

        if (_dataWidget) {
            this.dataWidget = _dataWidget;
        }

        var horleftWraper = new G_Horizontal_Layout(this, "left");
        var hormiddleWraper = new G_Horizontal_Layout(this, "middle");
        var horrightWraper = new G_Horizontal_Layout(this, "right");

        var varInWidget = new G_Var_In_Widget(horleftWraper, 30, 30, this.data.color, this);
        this.varInWidget = varInWidget;
        var variablesIdentiferWidget = new G_Plain_Text(hormiddleWraper, 100, 30, this.data.identifier);
        this.variablesIdentiferWidget = variablesIdentiferWidget;
        var varOutWidget = new G_Var_Out_Widget(horrightWraper, 30, 30, this.data.color, this);
        this.varOutWidget = varOutWidget;

        variablesIdentiferWidget.updateGUI();

        horleftWraper.updateGUI();
        hormiddleWraper.updateGUI();
        horrightWraper.updateGUI();
    }

    getDataCCode() {
        let ccode = "";
        if (this.dataWidget) {
            ccode += this.dataWidget.getDataCCode();

            if (this.dataWidget.data.bPointer === true) {
                ccode += "->";
            } else if (this.dataWidget.data.bPointer === false) {
                ccode += ".";
            }
        }
        ccode += this.data.identifier;
        return ccode;
    }

    updateBindingData(_data) {
        this.data = _data;

        this.varInWidget.setColor(this.data.color);
        this.varOutWidget.setColor(this.data.color);
        this.variablesIdentiferWidget.setString(this.data.identifier);
        this.variablesIdentiferWidget.updateGUI();
    }

    destroy() {
        G_Widget.prototype.destroy.call(this);
        this.data.removeBindingWidget(this);
    }
}

//--------------------------------------------------------------------------

class G_GetNode_Variable_Field_Widget extends G_Horizontal_Layout {
    bDeconstructed = false;

    constructor(_classparent, _data) {
        super(_classparent);

        this.data = _data;

        var horWraper = new G_Horizontal_Layout(this, "right");

        var IdentiferWidget = new G_Text_Button(horWraper, 50, 30, this.data.identifier);
        this.IdentiferWidget = IdentiferWidget;

        var varOutWidget = new G_Var_Out_Widget(horWraper, 30, 30, this.data.color, this);

        this.varOutWidget = varOutWidget;

        IdentiferWidget.updateGUI = G_Plain_Text.prototype.updateGUI;
        IdentiferWidget.textAlignLeft();
        IdentiferWidget.updateGUI();
    }

    getDataCCode() {
        return this.data.identifier;
    }
}

class G_SetNode_Variable_Field_Widget extends G_Horizontal_Layout {
    bDeconstructed = false;

    constructor(_classparent, _data) {
        super(_classparent);

        this.data = _data;

        var horleftWraper = new G_Horizontal_Layout(this, "left");
        var hormiddleWraper = new G_Horizontal_Layout(this, "middle");
        var horrightWraper = new G_Horizontal_Layout(this, "right");

        var varInWidget = new G_Var_In_Widget(horleftWraper, 30, 30, this.data.color, this);
        this.varInWidget = varInWidget;
        var IdentiferWidget = new G_Text_Button(hormiddleWraper, 100, 30, this.data.identifier);
        this.IdentiferWidget = IdentiferWidget;
        var varOutWidget = new G_Var_Out_Widget(horrightWraper, 30, 30, this.data.color, this);
        this.varOutWidget = varOutWidget;

        IdentiferWidget.updateGUI = G_Plain_Text.prototype.updateGUI;
        IdentiferWidget.textAlignLeft();
        IdentiferWidget.updateGUI();

        horleftWraper.updateGUI();
        hormiddleWraper.updateGUI();
        horrightWraper.updateGUI();
    }

    getDataCCode() {
        return this.data.identifier;
    }
}

//--------------------------------------------------------------------------

class I_bindingArray {
    bindingArray = [];

    getBindingArray() {
        return this.bindingArray;
    }

    setBindingArray(_bindingArray) {
        this.bindingArray = _bindingArray;
    }

    addRemindClassToBindingArray() {
        if (!this.bindingArray.remindClass) {
            this.bindingArray.remindClass = [];
        }
        this.bindingArray.remindClass.push(this);
    }

    removeRemindClassToBindingArray() {
        if (this.bindingArray.remindClass) {
            this.bindingArray.remindClass.remove(this);
        }
    }

    updateRemindClassData() {
        for (let i = 0; i < this.bindingArray.remindClass.length; ++i) {
            this.bindingArray.remindClass[i].updateChildWidgets();
        }
    }

    createNewObject() {
        console.log("createNewObject");
    }

    addNewObjectToBindingArray(_newObj) {
        let newObj = null;
        if (_newObj) {
            newObj = _newObj
        } else {
            newObj = this.createNewObject();
        }

        if (newObj) {
            this.bindingArray.push(newObj);
            this.updateRemindClassData();
        }
    }
}

class I_childWidget {
    childWidgets = [];

    getChildrenWidgets() {
        return this.children;
    }

    getWidgetDataArray() {
        let dataArr = [];
        for (let i = 0; i < this.childWidgets.length; ++i) {
            dataArr.push(this.childWidgets[i].data);
        }
        return dataArr;
    }

    filterInvalidChildWidgets() {
        let childrenWidgets = this.getChildrenWidgets();
        this.childWidgets = this.childWidgets.filter(widget => childrenWidgets.includes(widget));
    }

    addNewChildWidgets() {
        let widgetDataArr = this.getWidgetDataArray();
        let realDataArr = this.getBindingArray();

        for (let i = 0; i < realDataArr.length; ++i) {
            if (widgetDataArr.includes(realDataArr[i]) === false) {
                this.addChildWidget(realDataArr[i]);
            }
        }
        this.updateGUI();
    }

    removeInvalidChildWidgets() {
        this.filterInvalidChildWidgets();

        let realDataArr = this.getBindingArray();

        for (let i = this.childWidgets.length - 1; i >= 0; --i) {
            if (realDataArr.includes(this.childWidgets[i].data) === false) {
                this.childWidgets[i].data.removeBindingWidget(this.childWidgets[i]);
                this.childWidgets[i].destroy();
                this.childWidgets.remove(this.childWidgets[i]);
            }
        }
        this.updateGUI();
    }

    updateChildWidgets() {
        this.addNewChildWidgets();
        this.removeInvalidChildWidgets();
    }

    addChildWidget(_data) {
        console.log("addChildWidget", this);
    }
}

//--

class G_Draggable_Widget extends G_Terminal_Widget {
    dragStartX = 0;
    dragStartY = 0;

    connectedWidgets = [];

    constructor(_x, _y) {
        super(coderoot.code_workarea_svg, _x, _y);
        this.back.belongClass = this;
        coderoot.workarea_widget.existingWidgets.push(this);
    }

    dragbegin(e) {
        this.dragStartX = e.offsetX;
        this.dragStartY = e.offsetY;

        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i].connectedWidget) {
                this.connectedWidgets[i].updateCenterXY();
            }
        }

    }

    updateGUI() {
        if (this.terminalWidget) {
            G_Terminal_Widget.prototype.updateGUI.call(this);

            //---------------

            for (var i = 0; i < this.connectedWidgets.length; ++i) {
                if (this.connectedWidgets[i].connectedWidget) {
                    this.connectedWidgets[i].updateCenterXY();
                    this.connectedWidgets[i].updateActivatedWire(0, 0);
                }
            }
        }
    }

    updatconnectedWidgetsWire(deltaX, deltaY) {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i].connectedWidget) {
                this.connectedWidgets[i].updateActivatedWire(deltaX, deltaY);
            }
        }
    }

    dragging(e) {
        const deltaX = e.offsetX - this.dragStartX;
        const deltaY = e.offsetY - this.dragStartY;

        $(this.svg).attr("x", this.x + deltaX);
        $(this.svg).attr("y", this.y + deltaY);
        this.updatconnectedWidgetsWire(deltaX, deltaY);
    }

    dragend(e) {
        const deltaX = e.offsetX - this.dragStartX;
        const deltaY = e.offsetY - this.dragStartY;

        this.x += deltaX;
        this.y += deltaY;

        $(this.svg).attr("x", this.x);
        $(this.svg).attr("y", this.y);
    }

    destroy() {
        G_Widget.prototype.destroy.call(this);
        coderoot.workarea_widget.existingWidgets.remove(this);
    }

    highlight() {
        $(this.back).attr("fill", "#2B8CEC");
    }

    dishighlight() {
        $(this.back).attr("fill", "#000000");
    }
}

class G_Children_Widget extends Super_Interfaces(G_Vertical_Layout, I_childWidget, I_bindingArray) {
    bindingArrayCMD = "";
    constructor(_classparent, _data, _align, _dataWidget) {
        super(_classparent, _align);
        this.data = _data;
        this.dataWidget = _dataWidget;

        this.data.addBindingWidget(this);
        // this.setBindingArray(this.data.input);
        // this.addRemindClassToBindingArray();
        // this.updateChildWidgets();
    }

    setChildWidgetClass(_childWidgetClass) {
        this.childWidgetClass = _childWidgetClass;
    }

    setBindingArrayCMD(_cmd) {
        this.bindingArrayCMD = _cmd;
        this.setBindingArray(eval(this.bindingArrayCMD));
        this.addRemindClassToBindingArray();

        this.updateChildWidgets();
    }

    addChildWidget(_data) {
        var widget = new this.childWidgetClass(this, _data, "left", this.dataWidget);
        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    updateBindingData(_data) {
        this.data = _data;
        this.setBindingArray(eval(this.bindingArrayCMD));
    }

    updateGUI(dontBubble, dontsibling) {
        var widthArr = [0];

        this.children.forEach(child => {
            if (child.ignore != true) {
                widthArr.push(child.width);
            }
        });

        this.innerwidth = Math.max(...widthArr);

        //------------------
        let nextY = 0;
        this.children.forEach(child => {
            if (child.ignore != true) {
                child.y = nextY;
                $(child.svg).attr("y", child.y);
                nextY += child.height;
            }
        });
        this.innerheight = nextY;

        this.updateOutter();
        this.updateLayout();

        if (dontsibling != true) {//!!!!!!!!!! consider normalize
            for (let i = 0; i < this.classparent.children.length; ++i) {
                if (this.classparent.children[i] != this) {
                    this.classparent.children[i].updateGUI(true, true);
                }
            }
        }

        if (dontBubble != true) {
            this.classparent.updateGUI();
        }
    }

    destroy() {
        this.data = null;
        this.removeRemindClassToBindingArray();
        G_Widget.prototype.destroy.call(this);
    }
}

class G_GetNode extends Super_Interfaces(G_Draggable_Widget, I_childWidget, I_bindingArray) {
    bDeconstructed = false;

    constructor(_x, _y, _data) {
        super(_x, _y);
        this.data = _data;
        this.data.addBindingWidget(this);
        this.setBindingArray(this.data.memberVariableArr);

        var main_ver = new G_Vertical_Layout(this);
        this.main_ver = main_ver;

        this.terminalWidget = main_ver;

        var variableFieldWidget = new G_GetNode_Variable_Field_Widget(main_ver, this.data);
        this.variableFieldWidget = variableFieldWidget;

        this.variableFieldWidget.IdentiferWidget.belongClass = this;
        this.variableFieldWidget.IdentiferWidget.clickHandler = this.toggleStructForm;

        main_ver.updateGUI();
    }

    addChildWidget(_data) {
        var widget = new G_Variable_Out_Field_Widget(this.terminalWidget, _data, "left", this);
        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    getChildrenWidgets() {
        return this.terminalWidget.children;
    }

    splitStruct() {
        this.bDeconstructed = true;
        this.variableFieldWidget.varOutWidget.setConnectable(false);
        this.updateChildWidgets();
    }

    removeAllChildWidgets() {
        this.filterInvalidChildWidgets();

        for (let i = 0; i < this.childWidgets.length; ++i) {
            this.childWidgets[i].data.removeBindingWidget(this.childWidgets[i]);
            this.childWidgets[i].destroy();
        }
        this.childWidgets = [];
        this.terminalWidget.updateGUI();
    }

    recombineStruct() {
        this.bDeconstructed = false;
        this.variableFieldWidget.varOutWidget.setConnectable(true);
        this.removeAllChildWidgets();
    }

    toggleStructForm() {
        let that = this.belongClass;
        if (that.data.type === "struct") {
            if (that.bDeconstructed === false) {
                that.splitStruct();
            } else if (that.bDeconstructed === true) {
                that.recombineStruct();
            }
        }
    }

    updateBindingData(_data) {
        this.data = _data;
        this.setBindingArray(this.data.memberVariableArr);

        this.variableFieldWidget.varOutWidget.setColor(this.data.color);
        this.variableFieldWidget.IdentiferWidget.setString(this.data.identifier);

        if (this.bDeconstructed) {
            if (this.data.type === "struct") {
                this.splitStruct();
            } else {
                this.recombineStruct();
            }
        }
    }

    getDataCCode() {
        return this.data.identifier;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.functionUniqueId = coderoot.Current_Function.UniqueId;
        obj.UniqueId = this.data.UniqueId;
        obj.bDeconstructed = this.bDeconstructed;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    destroyFromGUI() {
        this.data.removeBindingWidget(this);
        this.destroy();
    }
}

class G_SetNode extends Super_Interfaces(G_Draggable_Widget, I_childWidget, I_bindingArray) {
    bDeconstructed = false;

    constructor(_x, _y, _data) {
        super(_x, _y);

        this.data = _data;
        this.data.addBindingWidget(this);
        this.setBindingArray(this.data.memberVariableArr);

        var main_ver = new G_Vertical_Layout(this);
        this.main_ver = main_ver;

        this.terminalWidget = main_ver;

        var titleAlignWraper = new G_Horizontal_Layout(main_ver);
        var titleWraper = new G_Horizontal_Layout(titleAlignWraper, "middle");
        var plainTextWidget = new G_Plain_Text(titleWraper, 100, 30, "SET");

        plainTextWidget.updateGUI();
        // //--

        var execAlignWraper = new G_Horizontal_Layout(main_ver);
        var execInWraper = new G_Horizontal_Layout(execAlignWraper);
        var execOutWraper = new G_Horizontal_Layout(execAlignWraper, "right");
        var execInWidget = new G_Exec_In_Widget(execInWraper, 30, 30);
        execInWraper.updateGUI();

        var execOutWidget = new G_Exec_Out_Widget(execOutWraper, 30, 30);
        execOutWraper.updateGUI();
        //--

        var variableFieldWidget = new G_SetNode_Variable_Field_Widget(main_ver, this.data);
        this.variableFieldWidget = variableFieldWidget;

        this.variableFieldWidget.IdentiferWidget.belongClass = this;
        this.variableFieldWidget.IdentiferWidget.clickHandler = this.toggleStructForm;

        main_ver.updateGUI();
    }

    addChildWidget(_data) {
        var widget = new G_Variable_In_Out_Field_Widget(this.terminalWidget, _data, "left", this);
        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    getChildrenWidgets() {
        return this.terminalWidget.children;
    }

    splitStruct() {
        this.bDeconstructed = true;
        this.variableFieldWidget.varInWidget.setConnectable(false);
        this.variableFieldWidget.varOutWidget.setConnectable(false);
        this.updateChildWidgets();
    }

    removeAllChildWidgets() {
        this.filterInvalidChildWidgets();

        for (let i = 0; i < this.childWidgets.length; ++i) {
            this.childWidgets[i].data.removeBindingWidget(this.childWidgets[i]);
            this.childWidgets[i].destroy();
        }
        this.childWidgets = [];
        this.terminalWidget.updateGUI();
    }

    recombineStruct() {
        this.bDeconstructed = false;
        this.variableFieldWidget.varInWidget.setConnectable(true);
        this.variableFieldWidget.varOutWidget.setConnectable(true);
        this.removeAllChildWidgets();
    }

    toggleStructForm() {
        let that = this.belongClass;
        if (that.data.type === "struct") {
            if (that.bDeconstructed === false) {
                that.splitStruct();
            } else if (that.bDeconstructed === true) {
                that.recombineStruct();
            }
        }
    }

    updateBindingData(_data) {
        this.data = _data;
        this.setBindingArray(this.data.memberVariableArr);

        this.variableFieldWidget.varInWidget.setColor(this.data.color);
        this.variableFieldWidget.varOutWidget.setColor(this.data.color);
        this.variableFieldWidget.IdentiferWidget.setString(this.data.identifier);

        if (this.bDeconstructed) {
            if (this.data.type === "struct") {
                this.splitStruct();
            } else {
                this.recombineStruct();
            }
        }
    }

    getInputCon() {
        let inputArr = [];
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                inputArr.push(this.connectedWidgets[i]);
                // return this.connectedWidgets[i];
            }
        }
        return inputArr;
    }

    getOutputCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_Out_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    generateCCode() {
        let inputCon = this.getInputCon();
        let outputCon = this.getOutputCon();

        let expressions = [];

        for (let i = 0; i < inputCon.length; ++i) {
            expressions.push(inputCon[i].getCCode() + " = " + inputCon[i].connectedWidget.getCCode() + ";");
        }
        return expressions;
    }

    getDataCCode() {
        return this.data.identifier;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.functionUniqueId = coderoot.Current_Function.UniqueId;
        obj.UniqueId = this.data.UniqueId;
        obj.bDeconstructed = this.bDeconstructed;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    destroyFromGUI() {
        this.data.removeBindingWidget(this);
        this.destroy();
    }
}

class G_InputNode extends G_Draggable_Widget {
    childWidgets = [];

    constructor(_x, _y, _function) {
        super(_x, _y);

        this.function = _function;
        this.function.addBindingWidget(this);

        var main_ver = new G_Vertical_Layout(this);
        this.main_ver = main_ver;
        this.terminalWidget = main_ver;
        var titleHor = new G_Horizontal_Layout(main_ver);
        var execHor = new G_Horizontal_Layout(main_ver);
        var iconWidget = new G_Icon_Widget(titleHor, 30, 30);
        var plainTextWidget = new G_Plain_Text(titleHor, 100, 30, this.function.name);
        this.plainTextWidget = plainTextWidget;
        plainTextWidget.updateGUI();
        var execOutWraper = new G_Horizontal_Layout(execHor, "right");
        var execOutWidget = new G_Exec_Out_Widget(execOutWraper, 30, 30);
        execOutWraper.updateGUI();


        var sub_hor = new G_Horizontal_Layout(main_ver);
        var childrenWidget = new G_Children_Widget(sub_hor, this.function, "right");
        childrenWidget.setChildWidgetClass(G_Variable_Out_Field_Widget);
        childrenWidget.setBindingArrayCMD("this.data.input");
        this.childrenWidget = childrenWidget;

    }

    updateBindingData(_function) {
        this.function = _function;
        this.plainTextWidget.setString(this.function.name);
        this.plainTextWidget.updateGUI();
    }

    generateCCode() {
        // console.log("G_InputNode");
        let expressions = [];

        // expressions.push(this.function.Declaration.replace(";", "") + "{");

        if (this.function.return[0]) {
            expressions.push(...this.function.return[0].CCodeDefinition());
        }



        for (var i = 0; i < this.function.variables.length; ++i) {
            expressions.push(...this.function.variables[i].CCodeDefinition());
        }

        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.UniqueId = this.function.UniqueId;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    destroyFromGUI() {
        this.function.removeBindingWidget(this);
        this.function.removeBindingWidget(this.childrenWidget);
        this.destroy();
    }
}

class G_ReturnNode extends G_Draggable_Widget {
    constructor(_x, _y, _function) {
        super(_x, _y);

        this.function = _function;
        this.function.addBindingWidget(this);

        var main_ver = new G_Vertical_Layout(this);
        this.main_ver = main_ver;

        this.terminalWidget = main_ver;

        var titleHor = new G_Horizontal_Layout(main_ver);
        var execHor = new G_Horizontal_Layout(main_ver);
        var iconWidget = new G_Icon_Widget(titleHor, 30, 30);
        var plainTextWidget = new G_Plain_Text(titleHor, 120, 30, "Return Node");
        plainTextWidget.updateGUI();

        var execOutWraper = new G_Horizontal_Layout(execHor);
        var execOutWidget = new G_Exec_In_Widget(execOutWraper, 30, 30);
        execOutWraper.updateGUI();


        var childrenWidget = new G_Children_Widget(main_ver, this.function);
        childrenWidget.setChildWidgetClass(G_Variable_In_Field_Widget);
        childrenWidget.setBindingArrayCMD("this.data.return");
        this.childrenWidget = childrenWidget;
    }

    updateBindingData(_data) {
        this.function = _data;
    }

    getCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    generateCCode() {
        var con = this.getCon();

        let expressions = [];

        if (con) {
            expressions.push(this.function.return[0].identifier + " = " + con.connectedWidget.getCCode() + ";");
        }

        if (this.function.return[0]) {
            expressions.push("return " + this.function.return[0].identifier + ";");
        }

        expressions.push("}");
        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.UniqueId = this.function.UniqueId;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    destroyFromGUI() {
        this.function.removeBindingWidget(this);
        this.function.removeBindingWidget(this.childrenWidget);
        this.destroy();
    }
}

class G_CallNode extends G_Draggable_Widget {
    constructor(_x, _y, _function) {
        super(_x, _y);

        this.function = _function;
        this.function.addBindingWidget(this);

        var main_ver = new G_Vertical_Layout(this);

        this.terminalWidget = main_ver;

        var titleHor = new G_Horizontal_Layout(main_ver);
        var execHor = new G_Horizontal_Layout(main_ver);
        var bot_hor = new G_Horizontal_Layout(main_ver);

        var iconWidget = new G_Icon_Widget(titleHor, 30, 30);
        var plainTextWidget = new G_Plain_Text(titleHor, 100, 30, this.function.name);
        this.plainTextWidget = plainTextWidget;

        plainTextWidget.updateGUI();

        var execInWraper = new G_Horizontal_Layout(execHor);
        var execOutWraper = new G_Horizontal_Layout(execHor, "right");
        var execInWidget = new G_Exec_In_Widget(execInWraper, 30, 30);

        execInWraper.updateGUI();

        var execOutWidget = new G_Exec_Out_Widget(execOutWraper, 30, 30);
        execOutWraper.updateGUI();
        //-----------

        var lleft_ver = new G_Children_Widget(bot_hor, this.function);
        lleft_ver.setChildWidgetClass(G_Variable_In_Field_Widget);
        lleft_ver.setBindingArrayCMD("this.data.input");
        this.lleft_ver = lleft_ver;


        var rright_ver = new G_Children_Widget(bot_hor, this.function, "right", this);
        rright_ver.setChildWidgetClass(G_Variable_Out_Field_Widget);
        rright_ver.setBindingArrayCMD("this.data.return");
        this.rright_ver = rright_ver;
    }

    updateBindingData(_function) {
        this.function = _function;
        this.plainTextWidget.setString(this.function.name);
        this.plainTextWidget.updateGUI();
    }

    getInputCons() {
        var arr = [];
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                arr.push(this.connectedWidgets[i]);
            }
        }

        return arr;
    }

    getOutputCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_Out_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    getDataCCode() {
        var inputCons = this.getInputCons();
        var outputCon = this.getOutputCon();

        var argStr = "";

        function compare(a, b) {
            let adata = a.classparent.classparent.data;
            let bdata = b.classparent.classparent.data;
            if (adata.belongArray.indexOf(adata) < bdata.belongArray.indexOf(bdata)) {
                return -1;
            }
            if (adata.belongArray.indexOf(adata) > bdata.belongArray.indexOf(bdata)) {
                return 1;
            }
            return 0;
        }

        inputCons.sort(compare);

        for (var i = 0; i < inputCons.length; ++i) {
            argStr += (inputCons[i].connectedWidget.getCCode() + ", ");
        }

        argStr = argStr.substring(0, argStr.length - 2);

        return this.function.name + "(" + argStr + ")";
    }

    generateCCode() {
        let expressions = [];
        if (this.function.return[0]) {
            return expressions;
        }
        expressions.push(this.getDataCCode() + ";");
        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.UniqueId = this.function.UniqueId;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    destroyFromGUI() {
        this.function.removeBindingWidget(this);
        this.function.removeBindingWidget(this.lleft_ver);
        this.function.removeBindingWidget(this.rright_ver);
        this.destroy();
    }
}

class G_Operator_Widget extends G_Draggable_Widget {
    operator = "?";
    constructor(_x, _y, _operator) {
        super(_x, _y);
        this.operator = _operator;
    }

    destroyFromGUI() {
        this.destroy();
    }
}

class G_Unary_operator_Widget extends G_Operator_Widget {
    constructor(_x, _y, _operator) {
        super(_x, _y, _operator);

        let main_hor = new G_Horizontal_Layout(this);

        this.terminalWidget = main_hor;

        let left_ver = new G_Vertical_Layout(main_hor);
        let middle_ver = new G_Vertical_Layout(main_hor);
        let right_ver = new G_Vertical_Layout(main_hor);

        // let execIn = new G_Exec_In_Widget(left_ver, 30, 30);
        // left_ver.updateGUI();
        let rightVar = new G_Var_In_Widget(left_ver, 30, 30, "#FFFFFF", this); rightVar.marker = "right";
        left_ver.updateGUI();
        //---

        let signWidget = new G_Plain_Text(middle_ver, 60, 30, this.operator);
        this.signWidget = signWidget;

        // signWidget.setIcon("+");
        middle_ver.updateGUI();

        //--
        // let exec_Out = new G_Exec_Out_Widget(right_ver, 30, 30);
        // right_ver.updateGUI();
        let resultVar = new G_Var_Out_Widget(right_ver, 30, 30, "#FFFFFF", this);
        right_ver.updateGUI();
    }

    getInputCons() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    getOutputCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_Out_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    getDataCCode() {
        var inputCons = this.getInputCons();
        var outputCon = this.getOutputCon();

        var rightType = inputCons.connectedWidget.getCCode();

        if (this.operator.indexOf("post") === 0) {
            return "(" + rightType + " " + this.operator.replace("post", "") + ")";
        } else {
            return "(" + this.operator + " " + rightType + ")";
        }
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.operator = this.operator;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }
}

class G_Binary_operator_Widget extends G_Operator_Widget {
    constructor(_x, _y, _operator) {
        super(_x, _y, _operator);

        let main_hor = new G_Horizontal_Layout(this);

        this.terminalWidget = main_hor;

        let left_ver = new G_Vertical_Layout(main_hor);
        let middle_ver = new G_Vertical_Layout(main_hor);
        let right_ver = new G_Vertical_Layout(main_hor);

        // let execIn = new G_Exec_In_Widget(left_ver, 30, 30);
        // left_ver.updateGUI();
        let leftVar = new G_Var_In_Widget(left_ver, 30, 30, "#FFFFFF", this); leftVar.marker = "left";
        left_ver.updateGUI();
        let rightVar = new G_Var_In_Widget(left_ver, 30, 30, "#FFFFFF", this); rightVar.marker = "right";
        left_ver.updateGUI();
        //---

        let signWidget = new G_Plain_Text(middle_ver, 60, 30, this.operator);
        this.signWidget = signWidget;

        // signWidget.setIcon("+");
        middle_ver.updateGUI();

        //--
        // let exec_Out = new G_Exec_Out_Widget(right_ver, 30, 30);
        // right_ver.updateGUI();
        let resultVar = new G_Var_Out_Widget(right_ver, 30, 30, "#FFFFFF", this);
        right_ver.updateGUI();
    }

    getInputCons() {
        var res = new Object();
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                if (this.connectedWidgets[i].marker === "left") {
                    res.left = this.connectedWidgets[i];
                } else if (this.connectedWidgets[i].marker === "right") {
                    res.right = this.connectedWidgets[i];
                }
            }
        }

        return res;
    }

    getOutputCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_Out_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    getDataCCode() {
        var inputCons = this.getInputCons();
        var outputCon = this.getOutputCon();

        var leftType = inputCons.left.connectedWidget.getCCode();
        var rightType = inputCons.right.connectedWidget.getCCode();

        return "(" + leftType + " " + this.operator + " " + rightType + ")";
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.operator = this.operator;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }
}

class G_Statement_Widget extends G_Operator_Widget {
    constructor(_x, _y, _operator) {
        super(_x, _y, _operator);

        let main_hor = new G_Horizontal_Layout(this);

        this.terminalWidget = main_hor;

        let left_ver = new G_Vertical_Layout(main_hor);
        let middle_ver = new G_Vertical_Layout(main_hor);
        let right_ver = new G_Vertical_Layout(main_hor);

        let execIn = new G_Exec_In_Widget(left_ver, 30, 30);
        this.execIn = execIn;
        left_ver.updateGUI();

        if (this.operator !== "else") {
            let varIn = new G_Var_In_Widget(left_ver, 30, 30, "#FFFFFF", this); varIn.marker = "left";
            this.varIn = varIn;
            left_ver.updateGUI();
        }

        //---

        let signWidget = new G_Plain_Text(middle_ver, 60, 30, this.operator);
        this.signWidget = signWidget;

        // signWidget.setIcon("+");
        middle_ver.updateGUI();

        //--
        let exec_Out = new G_Exec_Out_Widget(right_ver, 30, 30);
        this.exec_Out = exec_Out;
        right_ver.updateGUI();

        let sub_exec_Out = new G_Exec_Out_Widget(right_ver, 30, 30);
        this.sub_exec_Out = sub_exec_Out;
        right_ver.updateGUI();
    }

    getInputCons() {
        var res = new Object();
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_In_Widget) {
                if (this.connectedWidgets[i].marker === "left") {
                    res.left = this.connectedWidgets[i];
                } else if (this.connectedWidgets[i].marker === "right") {
                    res.right = this.connectedWidgets[i];
                }
            }
        }

        return res;
    }

    getOutputCon() {
        for (var i = 0; i < this.connectedWidgets.length; ++i) {
            if (this.connectedWidgets[i] instanceof G_Var_Out_Widget) {
                return this.connectedWidgets[i];
            }
        }
    }

    getDataCCode() {
        var inputCons = this.getInputCons();
        var outputCon = this.getOutputCon();

        var leftType = inputCons.left.connectedWidget.getCCode();
        var rightType = inputCons.right.connectedWidget.getCCode();

        return "(" + leftType + " " + this.operator + " " + rightType + ")";
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.operator = this.operator;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }

    generateCCode() {
        // console.log(this.execIn, this.varIn, this.exec_Out, this.sub_exec_Out);

        let expressions = [];

        if (this.operator !== "else") {
            expressions.push(this.operator + "(" + this.varIn.connectedWidget.getCCode() + "){");
        } else {
            expressions.push(this.operator + "{");
        }


        let nextNode = M_Function.prototype.GetNextNode.call(this, this, true);


        while (nextNode) {
            expressions.push(...nextNode.generateCCode());
            nextNode = M_Function.prototype.GetNextNode.call(this, nextNode);
        }

        expressions.push("}");

        return expressions;


        // var inputCon = this.getInputCon();
        // var outputCon = this.getOutputCon();

        // for (let i = 0; i < inputCon.length; ++i) {
        //     console.log(inputCon[i].getCCode() + " = " + inputCon[i].connectedWidget.getCCode() + ";");
        // }
    }
}

class G_ConstNode extends G_Draggable_Widget {
    constructor(_x, _y, _string) {
        super(_x, _y);

        if (!_string || _string === "const") { _string = "0" }


        let main_hor = new G_Horizontal_Layout(this);

        this.terminalWidget = main_hor;

        let left_ver = new G_Vertical_Layout(main_hor);
        let right_ver = new G_Vertical_Layout(main_hor);

        //---

        this.textInput = new G_Text_Input(left_ver, 60, 30, _string);
        left_ver.updateGUI();

        let varOut = new G_Var_Out_Widget(right_ver, 30, 30, "#FFFFFF", this);
        right_ver.updateGUI();
    }

    destroyFromGUI() {
        this.destroy();
    }

    getDataCCode() {
        return this.textInput.string;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.functionUniqueId = coderoot.Current_Function.UniqueId;
        obj.string = this.textInput.string;
        // obj.UniqueId = this.data.UniqueId;
        obj.bDeconstructed = this.bDeconstructed;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }
}

class G_StandaloneNode extends G_Draggable_Widget {
    constructor(_x, _y, _string) {
        super(_x, _y);

        if (!_string) { _string = ";" }


        let main_hor = new G_Horizontal_Layout(this);

        this.terminalWidget = main_hor;

        let left_ver = new G_Vertical_Layout(main_hor);
        let middle_ver = new G_Vertical_Layout(main_hor);
        let right_ver = new G_Vertical_Layout(main_hor);

        //---

        this.execIn = new G_Exec_In_Widget(left_ver, 30, 30, "#FFFFFF", this);
        middle_ver.updateGUI();

        this.textInput = new G_Text_Input(middle_ver, 60, 30, _string);
        middle_ver.updateGUI();

        this.execOut = new G_Exec_Out_Widget(right_ver, 30, 30, "#FFFFFF", this);
        right_ver.updateGUI();
    }

    destroyFromGUI() {
        this.destroy();
    }

    getDataCCode() {
        return this.textInput.string;
    }

    generateCCode() {
        let expressions = [];

        expressions.push(this.getDataCCode() + ";");

        // for (let i = 0; i < inputCon.length; ++i) {
        //     expressions.push(inputCon[i].getCCode() + " = " + inputCon[i].connectedWidget.getCCode() + ";");
        // }
        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.functionUniqueId = coderoot.Current_Function.UniqueId;
        obj.string = this.textInput.string;
        // obj.UniqueId = this.data.UniqueId;
        obj.bDeconstructed = this.bDeconstructed;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }
}

class G_PrintfNode extends G_Draggable_Widget {
    constructor(_x, _y, _string) {
        super(_x, _y);

        if (!_string || _string[0] != '\"') { _string = '"%d\\n"' }

        let main_ver = new G_Vertical_Layout(this);

        this.terminalWidget = main_ver;

        let hor_0 = new G_Horizontal_Layout(main_ver);
        let ver_0 = new G_Vertical_Layout(main_ver);

        let execInWidget = new G_Exec_In_Widget(hor_0, 30, 30, "#FFFFFF", this);
        new G_Plain_Text(hor_0, 60, 30, "printf");
        let execOutWidget = new G_Exec_Out_Widget(hor_0, 30, 30, "#FFFFFF", this);

        let textInput_wrap = new G_Vertical_Layout(ver_0);
        this.textInput = new G_Text_Input(textInput_wrap, 100, 30, _string);


        this.varIn = new G_Var_In_Widget(ver_0, 30, 30, "#FFFFFF", this);

        textInput_wrap.updateGUI();
        ver_0.updateGUI();
    }

    destroyFromGUI() {
        this.destroy();
    }

    generateCCode() {
        let expressions = [];

        if (!this.varIn.connectedWidget) {
            expressions.push("printf(" + this.textInput.string + ");");
            return expressions;
        }

        expressions.push("printf(" + this.textInput.string + "," + this.varIn.connectedWidget.getCCode() + ");");
        return expressions;
    }

    toJsonData() {
        let obj = new Object();
        obj.nodeName = this.constructor.name;
        obj.functionUniqueId = coderoot.Current_Function.UniqueId;
        obj.string = this.textInput.string;
        // obj.UniqueId = this.data.UniqueId;
        obj.bDeconstructed = this.bDeconstructed;
        obj.x = this.x;
        obj.y = this.y;

        let conArr = this.getAllConnectors();
        let InfoArray = [];
        for (let i = 0; i < conArr.length; ++i) {
            let ele = {};
            ele.UniqueId = conArr[i].UniqueId;
            let conId = null;
            if (conArr[i].connectedWidget) {
                conId = conArr[i].connectedWidget.UniqueId;
            }
            ele.ConnectedId = conId;
            InfoArray.push(ele);
        }
        obj.conInfoArray = InfoArray;

        return obj;
    }
}

//--------------------------------------------------------------------------

class G_Collapable_Widget extends G_Vertical_Layout {
    bDropped = false;

    constructor(_classparent) {
        super(_classparent);

        var top_hor = new G_Horizontal_Layout(this);
        this.top_hor = top_hor;

        var horWraper1 = new G_Horizontal_Layout(top_hor);
        this.CollapseButton = new G_Text_Button(horWraper1, 30, 30, "→");

        var horWraper2 = new G_Horizontal_Layout(top_hor);
        this.titlePlainText = new G_Plain_Text(horWraper2, 214, 30, " ")

        var horWraper3 = new G_Horizontal_Layout(top_hor);
        this.AddButton = new G_Text_Button(horWraper3, 30, 30, "+");

        this.horWraper1 = horWraper1;
        this.horWraper2 = horWraper2;
        this.horWraper3 = horWraper3;

        horWraper1.updateGUI();
        horWraper2.updateGUI();
        horWraper3.updateGUI();
        //----

        this.AddButton.collapableWidget = this;
        this.CollapseButton.collapableWidget = this;

        this.CollapseButton.clickHandler = function (e) {
            this.collapableWidget.toggleDrop();
        }

        this.AddButton.clickHandler = function (e) {
            this.collapableWidget.addNewObjectToBindingArray();
        }
    }

    setTitle(str) {
        this.titlePlainText.setString(str);
    }

    toggleDrop(_bDropped) {
        if (_bDropped === true || _bDropped === false) {
            this.bDropped = _bDropped;
        } else {
            this.bDropped = !this.bDropped;
        }

        if (this.bDropped === true) {
            this.CollapseButton.setString("↓");
        } else {
            this.CollapseButton.setString("→");
        }

        this.childWidgets.forEach(widget => {
            if (this.bDropped === true) {
                widget.ignore = false;
            } else {
                widget.ignore = true;
            }
        });

        this.updateGUI();
    }
}

class G_Struct_Field_Collapable_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    varNamePrefix = "var"
    varNameIndex = 0;

    constructor(_classparent, _data) {
        super(_classparent);

        this.data = _data;
        this.data.addBindingWidget(this);
        this.setBindingArray(this.data.memberVariableArr);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();

        this.titlePlainText.destroy();
        this.titlePlainText = new G_Text_Input(this.horWraper2, 125 - this.SvgPadding * 2, 30, this.data.dataType);
        this.horWraper2.updateGUI();

        var horWraper = new G_Horizontal_Layout(this.top_hor);
        var deleteButton = new G_Text_Button(horWraper, 30, 30, "x");

        horWraper.updateGUI();

        deleteButton.fieldWidget = this;
        deleteButton.clickHandler = this.delete;

        this.titlePlainText.variableFieldWidget = this;
        this.titlePlainText.changeHandler = function (e) {
            this.variableFieldWidget.data.setDataTypeByString(this.string);
        }
    }

    delete(e) {
        this.fieldWidget.data.delete();
    }

    // destroy() { //!!!!!!!!!!
    //     // this.classparent.bindingArray.remove(this.data);
    //     // this.classparent.childWidgets.remove(this);
    //     // G_Widget.prototype.destroy.call(this);
    // }

    updateBindingData(_data) {
        this.data = _data;

        this.titlePlainText.setString(this.data.dataType);
        this.updateChildWidgets();

    }

    updateChildWidgets() {
        I_childWidget.prototype.updateChildWidgets.call(this);
        // this.addNewChildWidgets();
        // this.removeInvalidChildWidgets();
        let remindClass = this.getBindingArray().remindClass;
        for (let i = 0; i < remindClass.length; ++i) {
            remindClass[i].data.updateBindingVariables();
        }
        //this.getBindingArray().remindClass.data.updateBindingVariables();
    }

    //
    createNewObject() {
        let newData = TypeManager.getBaseTypeVariable();
        newData.setIdentifier(this.data.varNamePrefix + this.data.varNameIndex++);
        newData.setBelongArray(this.bindingArray);

        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Struct_Variable_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }
}

class G_Global_Structs_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    varNamePrefix = "Gsture"
    varNameIndex = 0;

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Global Structs");
        this.setBindingArray(TypeManager.baseTypeArray);
        this.addRemindClassToBindingArray();

        this.updateChildWidgets();
    }

    addNewChildWidgets() {
        let widgetDataArr = this.getWidgetDataArray();
        let realDataArr = this.getBindingArray();

        for (let i = 0; i < realDataArr.length; ++i) {
            if (widgetDataArr.includes(realDataArr[i]) === false && realDataArr[i].type === "struct") {
                this.addChildWidget(realDataArr[i]);
            }
        }
        this.updateGUI();
    }

    createNewObject() {
        var newData = new M_Struct("struct", this.varNamePrefix + this.varNameIndex++, "var", this.bindingArray);
        newData.setBelongArray(TypeManager.baseTypeArray);
        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Struct_Field_Collapable_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    toJsonData() {
        let obj = new Object();
        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        return obj;
    }
}

class G_Global_Variables_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    varNamePrefix = "Gvar"
    varNameIndex = 0;

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Global Variabels");
        this.setBindingArray(coderoot.M_Variables);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
    }

    createNewObject() {
        let newData = TypeManager.getBaseTypeVariable();
        newData.setIdentifier(this.varNamePrefix + this.varNameIndex++);
        newData.setBelongArray(coderoot.M_Variables);

        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Variable_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    toJsonData() {
        let obj = new Object();
        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        return obj;
    }
}

class G_Global_Functions_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    varNamePrefix = "func"
    varNameIndex = -1;

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Global Functions");
        this.setBindingArray(coderoot.M_Functions);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
    }

    createNewObject() {
        let newData = null;
        if (this.varNameIndex === -1) {
            newData = new M_Function("main");
            this.varNameIndex++;
        } else {
            newData = new M_Function(this.varNamePrefix + this.varNameIndex++);
        }

        newData.setBelongArray(coderoot.M_Functions);
        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Function_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    toJsonData() {
        let obj = new Object();
        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        return obj;
    }
}

class G_Function_Name_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Function Name");
        this.horWraper3.destroy();

        var horWraper1 = new G_Horizontal_Layout(this);
        var horWraper11 = new G_Horizontal_Layout(horWraper1);

        this.childWidgets.push(horWraper1);

        var textInput = new G_Text_Input(horWraper11, 245, 30, " ");
        this.textInput = textInput;
        textInput.functionNameWidget = this;

        textInput.changeHandler = function (e) {
            if (coderoot.Current_Function) {
                coderoot.Current_Function.setFunctionName(this.string);
            }
        }

        if (this.bDropped === true) {
            horWraper1.ignore = false;
        } else {
            horWraper1.ignore = true;
        }

        textInput.updateGUI();
    }

    updateBindingData(_function) {
        this.function = _function;
        this.textInput.setString(this.function.name);
    }

    destroy() {
        this.function = null;
        this.textInput.setString("");
    }
}

class G_Output_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    constructor(_classparent) {
        super(_classparent);
        this.setTitle("Output");
    }

    updateBindingData(_function) {
        this.function = _function;
        this.setBindingArray(_function.return);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
    }

    createNewObject() {
        if (this.bindingArray.length > 0) {
            return null;
        }
        let newData = TypeManager.getBaseTypeVariable();
        newData.setIdentifier(coderoot.Current_Function.getNextVariableName());
        newData.setBelongArray(this.bindingArray);

        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Variable_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }
}

class G_Inputs_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    constructor(_classparent) {
        super(_classparent);
        this.setTitle("Inputs");
    }

    updateBindingData(_function) {
        this.function = _function;
        this.setBindingArray(_function.input);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
    }

    createNewObject() {
        let newData = TypeManager.getBaseTypeVariable();
        newData.setIdentifier(coderoot.Current_Function.getNextVariableName());
        newData.setBelongArray(this.bindingArray);

        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Variable_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }
}

class G_Variables_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    constructor(_classparent) {
        super(_classparent);
        this.setTitle("Variables");
    }

    updateBindingData(_function) {
        this.function = _function;
        this.setBindingArray(_function.variables);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
    }

    addChildWidget(_data) {
        var widget = new G_Variable_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    createNewObject() {
        let newData = TypeManager.getBaseTypeVariable();
        newData.setIdentifier(coderoot.Current_Function.getNextVariableName());
        newData.setBelongArray(this.bindingArray);

        return newData;
    }
}
//------

class G_Collapable_Operator_Widget extends Super_Interfaces(G_Collapable_Widget, I_childWidget) {
    operatorData = [];

    constructor(_classparent) {
        super(_classparent);
        this.AddButton.destroy();
    }

    addChildWidget(_data) {
        var widget = new G_Operator_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        // widget.updateGUI();
    }
}

class G_Condition_Statement_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Statement_Widget", operator: "if" },
        { description: "description", class: "G_Statement_Widget", operator: "else if" },
        { description: "description", class: "G_Statement_Widget", operator: "else" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Condition Statement");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Loop_Statement_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Statement_Widget", operator: "while" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Loop Statement");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Arithmetic_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Binary_operator_Widget", operator: "+" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "-" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "*" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "/" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "%" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "++" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "--" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "post++" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "post--" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Arithmetic Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Relational_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Binary_operator_Widget", operator: "==" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "!=" },
        { description: "description", class: "G_Binary_operator_Widget", operator: ">" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "<" },
        { description: "description", class: "G_Binary_operator_Widget", operator: ">=" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "<=" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Relational Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Logical_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Binary_operator_Widget", operator: "||" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "&&" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "!" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Logical Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Bit_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Binary_operator_Widget", operator: "&" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "|" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "^" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "~" },
        { description: "description", class: "G_Binary_operator_Widget", operator: "<<" },
        { description: "description", class: "G_Binary_operator_Widget", operator: ">>" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Bit Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Assignment_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Unary_operator_Widget", operator: "=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "+=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "-=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "*=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "/=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "%=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "<<=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: ">>=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "&=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "^=" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "|=" },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Assignment Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

class G_Miscellaneous_Operator_Widget extends G_Collapable_Operator_Widget {
    operatorData = [
        { description: "description", class: "G_Unary_operator_Widget", operator: "sizeof" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "&" },
        { description: "description", class: "G_Unary_operator_Widget", operator: "*" },
        { description: "description", class: "G_ConstNode", operator: "const" },
        { description: "description", class: "G_PrintfNode", operator: 'printf' },
        { description: "description", class: "G_StandaloneNode", operator: 'exp' },
    ];

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Miscellaneous Operator");

        for (let i = 0; i < this.operatorData.length; ++i) {
            this.operatorData[i].addBindingWidget = function () { };
            this.addChildWidget(this.operatorData[i]);
        }
    }
}

//------

class M_Project extends Super_Interfaces(M_Object, I_bindingWidgets, I_belongArray) {
    bLoaded = false;
    constructor(_name) {
        super();
        this.name = _name;
    }

    nameIsExist(_newname) {
        for (let i = 0; i < coderoot.M_Projects.length; ++i) {
            if (coderoot.M_Projects[i].name === _newname) {
                return true;
            }
        }
        return false;
    }

    rename(_newname) {
        if (_newname === this.name) {
            return;
        }

        let re = /^\w+$/;
        if (!re.test(_newname) || _newname.length < 1) {
            alert('Invalid Project Name');
        } else {

            if (this.nameIsExist(_newname)) {
                alert('The name exist!');
            } else {
                let obj = new Object();
                obj.cmd = "renameProject";
                obj.data = { oldname: this.name, newname: _newname };

                webSocket.send(JSON.stringify(obj));
                this.name = _newname;

                if(this.bLoaded){
                    coderoot.menu_bar.loadedProjectName.setString(this.name);
                }
            }
        }

        this.updateBindingWidgets();
    }

    save() {

    }

    load() {
        let obj = new Object();
        obj.cmd = "loadProject";
        obj.data = this.name;

        webSocket.send(JSON.stringify(obj));

        for(let i = 0;i<coderoot.M_Projects.length;++i){
            coderoot.M_Projects[i].bLoaded = false;
        }
        this.bLoaded = true;
        coderoot.menu_bar.loadedProjectName.setString(this.name);

    }

    delete() {
        let obj = new Object();
        obj.cmd = "deleteProject";
        obj.data = this.name;

        webSocket.send(JSON.stringify(obj));

        I_bindingWidgets.prototype.delete.call(this);
    }
}

class G_Project_Field_Widget extends G_Draggable_Field_Widget {
    constructor(_classparent, _data) {
        super(_classparent, _data);

        let horWraper1 = new G_Horizontal_Layout(this);
        this.textInput = new G_Text_Input(horWraper1, 140, 30, " ");

        this.textInput.changeHandler = function (e) {
            this.classparent.classparent.data.rename(this.string);
        }

        new G_Empty_Widget(horWraper1, 25, 10);
        this.loadButton = new G_Text_Button(horWraper1, 60, 30, "load");
        this.loadButton.fieldWidget = this;

        this.loadButton.clickHandler = function (e) {
            this.fieldWidget.data.load();
        }

        // this.textButton.clickHandler = function (e) {
        //     if (coderoot.Current_Function != this.fieldWidget.data) {
        //         if (coderoot.Current_Function) {
        //             coderoot.detail_widget.unloadFunction();
        //             coderoot.workarea_widget.unloadFunction();
        //         }

        //         coderoot.detail_widget.loadFunction(this.fieldWidget.data);
        //         coderoot.workarea_widget.loadFunction(this.fieldWidget.data);
        //     }
        // }

        let horWraper2 = new G_Horizontal_Layout(this, "right");
        this.deleteButton = new G_Text_Button(horWraper2, 30, 30, "x");

        this.deleteButton.data = this.data;
        this.deleteButton.clickHandler = function (e) {
            this.data.delete();
        }

        horWraper1.updateGUI();
        horWraper2.updateGUI();

        this.textInput.setString(this.data.name);
    }

    updateBindingData(_data) {
        this.data = _data;
        this.textInput.setString(this.data.name);
    }
}

class G_Project_List extends Super_Interfaces(G_Collapable_Widget, I_childWidget, I_bindingArray) {
    varNamePrefix = "project"
    varNameIndex = 0;

    constructor(_classparent) {
        super(_classparent);

        this.setTitle("Project List");
        this.setBindingArray(coderoot.M_Projects);
        this.addRemindClassToBindingArray();
        this.updateChildWidgets();
        this.toggleDrop(true);
    }

    createNewObject() {
        let name = this.varNamePrefix + this.varNameIndex;

        let newData = new M_Project(name);
        newData.setBelongArray(coderoot.M_Projects);
        ++this.varNameIndex;

        let obj = new Object();
        obj.cmd = "createProject";
        obj.data = name;

        webSocket.send(JSON.stringify(obj));

        obj = new Object();
        obj.cmd = "saveProjectConf";
        obj.data = this.toJsonData();

        webSocket.send(JSON.stringify(obj));


        return newData;
    }

    addChildWidget(_data) {
        var widget = new G_Project_Field_Widget(this, _data);

        if (this.bDropped === true) {
            widget.ignore = false;
        } else {
            widget.ignore = true;
        }

        this.childWidgets.push(widget);
        widget.updateGUI();
    }

    toJsonData() {
        let obj = new Object();
        obj.varNamePrefix = this.varNamePrefix;
        obj.varNameIndex = this.varNameIndex;
        return obj;
    }
}

class G_Project_Widget {
    constructor() {
        $(coderoot.code_project_svg).css("display", "block");
        let TW = new G_Terminal_Widget(coderoot.code_project_svg, 0, 0);
        let main_ver = new G_Vertical_Layout(TW);
        TW.terminalWidget = main_ver;

        let hor_0 = new G_Horizontal_Layout(main_ver);
        let hor_1 = new G_Horizontal_Layout(main_ver);
        let hor_2 = new G_Horizontal_Layout(main_ver);
        let hor_3 = new G_Horizontal_Layout(main_ver);

        //----------------------
        //


        let hor_wrap_0 = new G_Horizontal_Layout(hor_0, "right");

        let closeButton = new G_Text_Button(hor_wrap_0, 40, 40, "X");
        new G_Empty_Widget(hor_wrap_0, 40, 10);
        this.closeButton = closeButton;
        
        closeButton.clickHandler = function (e) {
            $(coderoot.code_project_svg).css("display", "none");
        }

        this.space_0 = new G_Empty_Widget(hor_1, 10, 10);


        let hor_wrap_1 = new G_Horizontal_Layout(hor_2, "middle");

        coderoot.project_list = new G_Project_List(hor_wrap_1);
        this.space_1 = new G_Empty_Widget(hor_3, 10, 1080);

        //----------------------

        hor_wrap_0.updateGUI();
        hor_1.updateGUI();
        hor_wrap_1.updateGUI();
        hor_2.updateGUI();

        this.updateEmptySpace();
        $(coderoot.code_project_svg).css("display", "none");
    }

    updateEmptySpace() {
        this.space_0.width = $("#code_project_rect")[0].getBBox().width - 10;
        this.space_0.height = $("#code_project_rect")[0].getBBox().height / 4 - 200;

        if (this.space_0.height < 1) {
            this.space_0.height = 1;
        }

        this.space_0.updateGUI();
    }
}

class G_Exp_Widget {
    constructor() {
        $(coderoot.code_exp_svg).css("display", "block");
        let TW = new G_Terminal_Widget(coderoot.code_exp_svg, 0, 0);
        let main_ver = new G_Vertical_Layout(TW);
        TW.terminalWidget = main_ver;

        let hor_0 = new G_Horizontal_Layout(main_ver);
        let hor_001 = new G_Horizontal_Layout(main_ver);
        let hor_1 = new G_Horizontal_Layout(main_ver);
        
        let hor_2 = new G_Horizontal_Layout(main_ver);
        let hor_3 = new G_Horizontal_Layout(main_ver);

        //----------------------
        //


        let hor_wrap_0 = new G_Horizontal_Layout(hor_0, "right");

        let closeButton = new G_Text_Button(hor_wrap_0, 40, 40, "X");
        new G_Empty_Widget(hor_wrap_0, 40, 10);

        closeButton.clickHandler = function (e) {
            $(coderoot.code_exp_svg).css("display", "none");
        }

        this.space_0 = new G_Empty_Widget(hor_1, 10, 10);

        let hor_wrap_2 = new G_Horizontal_Layout(hor_001, "middle");
        new G_Plain_Text(hor_wrap_2, 400, 40, "Human language(English) to C code");


        let hor_wrap_1 = new G_Horizontal_Layout(hor_2, "middle");

        let input = new G_Text_Input(hor_wrap_1, 300, 40, "assign 123 to ain9");
        new G_Empty_Widget(hor_wrap_1, 20, 40);
        let predictButton = new G_Text_Button(hor_wrap_1, 100, 40, "predict");
        new G_Empty_Widget(hor_wrap_1, 20, 40);
        let output = new G_Text_Input(hor_wrap_1, 300, 40, "");

        this.space_1 = new G_Empty_Widget(hor_3, 10, 1080);

        //----------------------

        hor_wrap_0.updateGUI();
        hor_1.updateGUI();
        hor_wrap_2.updateGUI();
        hor_wrap_1.updateGUI();
        hor_2.updateGUI();

        this.updateEmptySpace();
        $(coderoot.code_exp_svg).css("display", "none");

        predictButton.clickHandler = function (e) {
            predict(input.string, (text) => {
                output.setString(text);
            });
        }
    }

    updateEmptySpace() {
        this.space_0.width = $("#code_exp_rect")[0].getBBox().width - 10;
        this.space_0.height = $("#code_exp_rect")[0].getBBox().height / 2 - 300;

        if (this.space_0.height < 1) {
            this.space_0.height = 1;
        }

        this.space_0.updateGUI();
    }
}

class G_Menu_Bar {
    constructor() {
        let TW = new G_Terminal_Widget(coderoot.code_bar_svg, 0, 0);
        let hor_ver = new G_Horizontal_Layout(TW);
        TW.terminalWidget = hor_ver;

        //----------------------
        let projectButton = new G_Text_Button(hor_ver, 170, 40, "Projects");
        new G_Empty_Widget(hor_ver, 20, 40);
        this.projectButton = projectButton;

        projectButton.clickHandler = function (e) {
            $(coderoot.code_project_svg).css("display", "block");
            coderoot.project_widget.updateEmptySpace();
        }

        this.loadedProjectName = new G_Plain_Text(hor_ver, 200, 40, "");
        new G_Empty_Widget(hor_ver, 20, 40);

        let saveButton = new G_Text_Button(hor_ver, 70, 40, "Save");
        new G_Empty_Widget(hor_ver, 20, 40);

        saveButton.clickHandler = function (e) {
            coderoot.workarea_widget.saveNodeData();
            // console.log(coderoot.M_Variables);
            // console.log(coderoot.M_Functions);
            // console.log("------------------");
            let obj = new Object();
            obj.cmd = "saveProject";
            obj.data = {};
            obj.data.name = coderoot.menu_bar.loadedProjectName.string;
            obj.data.data = coderoot.toJsonData();
            console.log(obj);

            webSocket.send(JSON.stringify(obj));
        }

        let generateButton = new G_Text_Button(hor_ver, 120, 40, "Generate");
        new G_Empty_Widget(hor_ver, 20, 40);

        generateButton.clickHandler = function (e) {
            if(coderoot.menu_bar.loadedProjectName.string.length<1){
                return;
            }
            $("#code_textarea").html("");
            $("#stdout_textarea").html("");
            $("#code_generate_panel").css("display","block");
            
            let codeData = "";
            codeData += GenerateCode();

            let obj = new Object();
            obj.cmd = "generateCode";
            obj.data = {};
            obj.data.name = coderoot.menu_bar.loadedProjectName.string;
            obj.data.data = codeData;

            webSocket.send(JSON.stringify(obj));
        }

        let experimentalButton = new G_Text_Button(hor_ver, 170, 40, "Experimental");
        new G_Empty_Widget(hor_ver, 20, 40);

        experimentalButton.clickHandler = function (e) {
            $(coderoot.code_exp_svg).css("display", "block");
            coderoot.exp_widget.updateEmptySpace();
        }

        hor_ver.updateGUI();
    }
}

class G_Menu_Widget {
    constructor() {
        var TW = new G_Terminal_Widget(coderoot.code_menu_svg, 0, 0);
        var main_ver = new G_Vertical_Layout(TW);
        TW.terminalWidget = main_ver;

        this.GlobalStructsWidget = new G_Global_Structs_Widget(main_ver);
        this.GlobalVariablesWidget = new G_Global_Variables_Widget(main_ver);
        this.GlobalFunctionsWidget = new G_Global_Functions_Widget(main_ver);
        new G_Condition_Statement_Widget(main_ver);
        new G_Loop_Statement_Widget(main_ver);
        new G_Arithmetic_Operator_Widget(main_ver);
        new G_Relational_Operator_Widget(main_ver);
        new G_Logical_Operator_Widget(main_ver);
        new G_Bit_Operator_Widget(main_ver);
        // new G_Assignment_Operator_Widget(main_ver);
        new G_Miscellaneous_Operator_Widget(main_ver);

        //----------------------

        main_ver.updateGUI();
    }

    toJsonData() {
        let obj = new Object();
        obj.GlobalStructsWidget = this.GlobalStructsWidget.toJsonData();
        obj.GlobalVariablesWidget = this.GlobalVariablesWidget.toJsonData();
        obj.GlobalFunctionsWidget = this.GlobalFunctionsWidget.toJsonData();
        return obj;
    }
}

class G_Detail_Widget {
    function = null;
    constructor() {
        var TW = new G_Terminal_Widget(coderoot.code_detail_svg, 0, 0);
        var main_ver = new G_Vertical_Layout(TW);
        TW.terminalWidget = main_ver;

        var functionNameWidget = new G_Function_Name_Widget(main_ver);
        this.functionNameWidget = functionNameWidget;
        functionNameWidget.updateGUI();

        var outputWidget = new G_Output_Widget(main_ver);
        this.outputWidget = outputWidget;
        outputWidget.updateGUI();

        var inputsWidget = new G_Inputs_Widget(main_ver);
        this.inputsWidget = inputsWidget;
        inputsWidget.updateGUI();

        var variableWidget = new G_Variables_Widget(main_ver);
        this.variableWidget = variableWidget;
        variableWidget.updateGUI();
        //----------------------

        main_ver.updateGUI();
    }

    unloadFunction() {
        if (this.function) {
            this.function.removeBindingWidget(this.functionNameWidget);
            this.function.removeBindingWidget(this.outputWidget);
            this.function.removeBindingWidget(this.inputsWidget);
            this.function.removeBindingWidget(this.variableWidget);
        }
    }

    loadFunction(_function) {
        this.function = _function;

        this.functionNameWidget.updateBindingData(this.function);
        this.outputWidget.updateBindingData(this.function);
        this.inputsWidget.updateBindingData(this.function);
        this.variableWidget.updateBindingData(this.function);
        // this.function.load();
    }
}

class G_Drag_Visual_Widget {
    constructor() {
        $(coderoot.code_top_svg).css("display", "block");
        var TW = new G_Terminal_Widget(coderoot.code_top_svg, 0, -1000);
        this.terminalWidget = TW;
        var main_hor = new G_Horizontal_Layout(TW);
        TW.terminalWidget = main_hor;

        var iconWidget = new G_Icon_Widget(main_hor, 30, 30);
        this.iconWidget = iconWidget;
        var plainText = new G_Plain_Text(main_hor, 200, 30, " ")
        this.plainText = plainText;

        main_hor.updateGUI();
        $(coderoot.code_top_svg).css("display", "none");
    }

    setPosition(x, y) {
        $(this.terminalWidget.svg).attr("x", x);
        $(this.terminalWidget.svg).attr("y", y);
    }

    updateName(_name) {
        this.plainText.setString(_name);
        this.plainText.updateGUI();
    }
}

class G_GetSet_Visual_Widget {
    constructor() {
        $(coderoot.code_top_svg).css("display", "block");
        var TW = new G_Terminal_Widget(coderoot.code_top_svg, 0, -1000);
        this.terminalWidget = TW;
        var main_ver = new G_Vertical_Layout(TW);
        TW.terminalWidget = main_ver;

        var getButton = new G_Text_Button(main_ver, 60, 30, "Get");
        this.getButton = getButton;

        var setButton = new G_Text_Button(main_ver, 60, 30, "Set");
        this.setButton = setButton;

        main_ver.updateGUI();
        $(coderoot.code_top_svg).css("display", "none");
    }

    setPosition(x, y) {
        $(this.terminalWidget.svg).attr("x", x);
        $(this.terminalWidget.svg).attr("y", y);
    }
}

class G_Widgets_Menu_Widget {
    constructor() {
        $(coderoot.code_top_svg).css("display", "block");
        var TW = new G_Terminal_Widget(coderoot.code_top_svg, 0, -1000);
        this.terminalWidget = TW;
        var main_ver = new G_Vertical_Layout(TW);
        this.main_ver = main_ver;
        TW.terminalWidget = main_ver;



        main_ver.updateGUI();
        $(coderoot.code_top_svg).css("display", "none");
    }

    setContent(arr) {
        this.main_ver.children.forEach(child => {
            child.destroy();
        });
        this.main_ver.children = [];

        arr.forEach(widgetName => {
            var Btn = new G_Text_Button(this.main_ver, 150, 30, widgetName);
            Btn.belongClass = this;
            Btn.clickHandler = this.createWidget;
            this.main_ver.updateGUI();
        });
    }

    createWidget() {
        new classMap[this.string](this.belongClass.terminalWidget.x, this.belongClass.terminalWidget.y);
        this.belongClass.belongClass.resetGUI();
    }

    setPosition(x, y) {
        this.terminalWidget.x = x;
        this.terminalWidget.y = y;
        $(this.terminalWidget.svg).attr("x", x);
        $(this.terminalWidget.svg).attr("y", y);
    }
}

class G_Top_Widget {
    bTrack = false;
    pendingDragObj = null;

    pendingPosition = { x: 0, y: 0 };

    constructor() {
        this.dragVisualWidget = new G_Drag_Visual_Widget();
        this.getSetWidget = new G_GetSet_Visual_Widget();
        this.widgetsMenuWidget = new G_Widgets_Menu_Widget();

        this.widgetsMenuWidget.belongClass = this;

        this.getSetWidget.getButton.codeTopSvg = this;
        this.getSetWidget.setButton.codeTopSvg = this;

        this.getSetWidget.getButton.clickHandler = function (e) {
            this.codeTopSvg.implementGet();
        }

        this.getSetWidget.setButton.clickHandler = function (e) {
            this.codeTopSvg.implementSet();
        }

        coderoot.code_top_svg.belongClass = this;

        coderoot.code_top_svg.addEventListener("mousemove", function (e) {
            this.belongClass.mousemove(e);
        });

        coderoot.code_top_svg.addEventListener("mouseup", function (e) {
            this.belongClass.mouseup(e);
        });

        coderoot.code_top_svg.addEventListener("click", function (e) {
            this.belongClass.click(e);
        });
    }

    startShowDragVisualWidget(x, y) {
        if (this.pendingDragObj && this.pendingDragObj instanceof M_Variable) {
            this.dragVisualWidget.updateName(this.pendingDragObj.identifier);
        } else if (this.pendingDragObj && this.pendingDragObj instanceof M_Function) {
            this.dragVisualWidget.updateName(this.pendingDragObj.name);
        } else {
            this.dragVisualWidget.updateName(this.pendingDragObj.operator);
        }

        this.bTrack = true;
        this.dragVisualWidget.setPosition(x, y);
    }

    mousemove(e) {
        if (this.bTrack === true) {
            this.dragVisualWidget.setPosition(e.offsetX, e.offsetY);
        }
    }

    mouseup(e) {
        this.bTrack = false;
        this.pendingPosition.x = e.offsetX;
        this.pendingPosition.y = e.offsetY;

        if (e.button === LeftMouseClick) {
            if (this.pendingDragObj) {
                if (this.pendingDragObj instanceof M_Variable) {
                    this.getSetWidget.setPosition(e.offsetX, e.offsetY);
                } else if (this.pendingDragObj instanceof M_Function) {
                    this.implementCall();
                } else {
                    this.implementOperator();
                }
            }
            this.dragVisualWidget.setPosition(0, -1000);
        }
    }

    implementGet() {
        new G_GetNode(this.pendingPosition.x, this.pendingPosition.y, this.pendingDragObj);
        this.resetGUI();
    }

    implementSet() {
        new G_SetNode(this.pendingPosition.x, this.pendingPosition.y, this.pendingDragObj);
        this.resetGUI();
    }

    implementCall() {
        new G_CallNode(this.pendingPosition.x, this.pendingPosition.y, this.pendingDragObj);
        this.resetGUI();
    }

    implementOperator() {
        let operatorData = this.pendingDragObj;
        eval('new ' + operatorData.class + '(' + this.pendingPosition.x + ',' + this.pendingPosition.y + ',"' + operatorData.operator + '")');
        this.resetGUI();
    }

    click() {
        this.resetGUI();
    }

    resetGUI() {
        this.dragVisualWidget.setPosition(0, -1000);
        this.getSetWidget.setPosition(0, -1000);
        this.widgetsMenuWidget.setPosition(0, -1000);

        this.pendingDragObj = null;

        $(coderoot.code_top_svg).css("display", "none");
    }
}

class G_Bottom_Widget {
    constructor() {

    }
}

class G_Workarea_Widget {
    bPressed = false;
    targetWidget = null;
    moveMode = "";
    existingWidgets = [];
    selectedWidget = null;

    constructor() {

        coderoot.code_workarea_svg.belongClass = this;

        coderoot.code_workarea_svg.addEventListener("mousedown", function (e) {
            this.belongClass.mousedown(e);
        });

        coderoot.code_workarea_svg.addEventListener("mousemove", function (e) {
            this.belongClass.mousemove(e);
        });

        coderoot.code_workarea_svg.addEventListener("mouseup", function (e) {
            this.belongClass.mouseup(e);
        });

    }

    deleteSelectedWidget() {
        if (this.selectedWidget) {
            if (this.selectedWidget instanceof G_ReturnNode || this.selectedWidget instanceof G_InputNode) {
                return;
            }
            this.selectedWidget.destroyFromGUI();
            this.selectedWidget = null;
        }
    }

    mousedown(e) {
        e.preventDefault();
        $("#code_menu_svg").focus();
        if (e.button === LeftMouseClick || e.button === RightMouseClick) {
            this.bPressed = true;
            this.targetWidget = e.target.belongClass;

            if (this.targetWidget instanceof G_Draggable_Widget) {
                if (this.selectedWidget) {
                    this.selectedWidget.dishighlight();
                }
                this.selectedWidget = this.targetWidget;
                this.selectedWidget.highlight();
            } else if (this.targetWidget instanceof G_Workarea_Widget) {
                if (this.selectedWidget) {
                    this.selectedWidget.dishighlight();
                    this.selectedWidget = null;
                }
            }

            if (e.button === LeftMouseClick) {
                if (this.targetWidget instanceof G_Draggable_Widget) {
                    this.moveMode = "drag";
                } else if (this.targetWidget instanceof G_Connectable_Widget && !this.targetWidget.connectedWidget) {
                    this.moveMode = "connect";
                }

                switch (this.moveMode) {
                    case "drag":
                        if (this.targetWidget && this.targetWidget instanceof G_Draggable_Widget) {
                            this.targetWidget.dragbegin(e);
                        }
                        break;
                    case "connect":
                        if (this.targetWidget && this.targetWidget instanceof G_Connectable_Widget) {
                            this.targetWidget.connectbegin(e);
                        }
                        break;
                }
            } else if (e.button === RightMouseClick) {
                if (this.targetWidget instanceof G_Connectable_Widget && this.targetWidget.connectedWidget) {
                    this.moveMode = "disconnect";
                }
            }
        }
    }

    mousemove(e) {
        e.preventDefault();
        if (this.bPressed === true && this.targetWidget) {
            switch (this.moveMode) {
                case "drag":
                    if (this.targetWidget && this.targetWidget instanceof G_Draggable_Widget) {
                        this.targetWidget.dragging(e);
                    }
                    break;
                case "connect":
                    if (this.targetWidget && this.targetWidget instanceof G_Connectable_Widget) {
                        this.targetWidget.connecting(e);
                    }
                    break;
            }
        }
    }

    mouseup(e) {
        e.preventDefault();

        if (e.button === LeftMouseClick || e.button === RightMouseClick) {
            if (e.button === LeftMouseClick && this.targetWidget) {
                switch (this.moveMode) {
                    case "drag":
                        if (this.targetWidget && this.targetWidget instanceof G_Draggable_Widget) {
                            this.targetWidget.dragend(e);
                        }
                        break;
                    case "connect":
                        if (this.targetWidget && this.targetWidget instanceof G_Connectable_Widget) {
                            this.targetWidget.connectend(e);
                        }
                        break;
                }
            } if (e.button === RightMouseClick) {
                if (e.target === coderoot.code_workarea_svg) {
                    // $(coderoot.code_top_svg).css("display", "block");
                    // console.log(widgetsMenuWidgetArr);

                    // coderoot.top_widget.widgetsMenuWidget.setContent(widgetsMenuWidgetArr);
                    // coderoot.top_widget.widgetsMenuWidget.setPosition(e.offsetX, e.offsetY);
                } else if (this.targetWidget && this.targetWidget instanceof G_Connectable_Widget && this.targetWidget.connectedWidget) {
                    this.targetWidget.disconnect();
                }
            }

            this.targetWidget = null;
            this.moveMode = "";
            this.bPressed = false;
        }
    }

    saveNodeData() {
        if (!coderoot.Current_Function) {
            return;
        }

        coderoot.Current_Function.nodeJsonDataArray = [];

        for (let i = this.existingWidgets.length - 1; i >= 0; --i) {
            coderoot.Current_Function.nodeJsonDataArray.push(this.existingWidgets[i].toJsonData());
        }
    }

    unloadFunction() {
        this.saveNodeData();
        this.cleanExistingWidgets();
        coderoot.Current_Function = null;
    }

    cleanExistingWidgets(){
        for (let i = this.existingWidgets.length - 1; i >= 0; --i) {
            this.existingWidgets[i].destroyFromGUI();//from GUI
        }
    }

    loadFunction(_function) {
        if (_function.nodeJsonDataArray.length === 0) {
            new G_InputNode(350, 50, _function);
            new G_ReturnNode(350, 400, _function);
        } else {
            _function.load();
            // console.log(coderoot.Current_Function.nodeJsonDataArray);
        }

        coderoot.Current_Function = _function;
        // console.log(coderoot.Current_Function);
    }
}

//---


//---

const classMap = {
    "M_Object": M_Object,
    "M_Function": M_Function,
    "G_Widget": G_Widget,
    "G_Text_Input": G_Text_Input,
    "G_Text_Button": G_Text_Button,
    "G_Plain_Text": G_Plain_Text,
    "G_Text_Option": G_Text_Option,
    "G_Text_Select": G_Text_Select,
    "G_Connectable_Widget": G_Connectable_Widget,

};

let widgetsMenuWidgetArr = [
    "hello",
];


class NodeLoader {
    findFunctionById(_id) {
        for (let i = 0; i < coderoot.M_Functions.length; ++i) {
            if (_id === coderoot.M_Functions[i].UniqueId) {
                return coderoot.M_Functions[i];
            }
        }
    }

    findVariableById(_functionId, _variableId) {
        let func = this.findFunctionById(_functionId);

        for (let i = 0; i < func.input.length; ++i) {
            if (func.input[i].UniqueId === _variableId) {
                return func.input[i];
            }
        }

        for (let i = 0; i < func.return.length; ++i) {
            if (func.return[i].UniqueId === _variableId) {
                return func.return[i];
            }
        }

        for (let i = 0; i < func.variables.length; ++i) {
            if (func.variables[i].UniqueId === _variableId) {
                return func.variables[i];
            }
        }

        for (let i = 0; i < coderoot.M_Variables.length; ++i) {
            if (coderoot.M_Variables[i].UniqueId === _variableId) {
                return coderoot.M_Variables[i];
            }
        }
    }

    load_G_InputNode(nodedata) {
        let func = this.findFunctionById(nodedata.UniqueId);

        if (!func) {
            console.log("Cant find function!!!!");
            return;
        }

        let inputNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",func)");

        let conArr = inputNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return inputNode;
    }

    load_G_ReturnNode(nodedata) {
        let func = this.findFunctionById(nodedata.UniqueId);

        if (!func) {
            console.log("Cant find function!!!!");
            return;
        }

        let returnNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",func)");

        let conArr = returnNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return returnNode;
    }

    load_G_CallNode(nodedata) {
        let func = this.findFunctionById(nodedata.UniqueId);

        if (!func) {
            console.log("Cant find function!!!!");
            return;
        }

        let callNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",func)");

        let conArr = callNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }


        return callNode;
    }

    load_G_GetNode(nodedata) {
        let variable = this.findVariableById(nodedata.functionUniqueId, nodedata.UniqueId);

        if (!variable) {
            console.log("Cant find variable!!!!");
            return;
        }

        let getnode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",variable)");

        if (nodedata.bDeconstructed === true) {
            getnode.splitStruct();
        }

        let conArr = getnode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return getnode;
    }

    load_G_ConstNode(nodedata) {
        let setnode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",nodedata.string)");

        let conArr = setnode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return setnode;
    }

    load_G_StandaloneNode(nodedata) {
        let setnode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",nodedata.string)");

        let conArr = setnode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return setnode;
    }

    load_G_PrintfNode(nodedata) {
        let setnode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",nodedata.string)");

        let conArr = setnode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return setnode;
    }

    load_G_SetNode(nodedata) {
        let variable = this.findVariableById(nodedata.functionUniqueId, nodedata.UniqueId);

        if (!variable) {
            console.log("Cant find variable!!!!");
            return;
        }

        let setnode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",variable)");

        if (nodedata.bDeconstructed === true) {
            setnode.splitStruct();
        }

        let conArr = setnode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return setnode;
    }

    load_G_Binary_operator_Widget(nodedata) {
        let opeNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",'" + nodedata.operator + "')");
        let conArr = opeNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return opeNode;
    }

    load_G_G_Unary_operator_Widget(nodedata) {
        let opeNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",'" + nodedata.operator + "')");

        let conArr = opeNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return opeNode;
    }

    load_G_G_Statement_Widget(nodedata) {
        let opeNode = eval("new " + nodedata.nodeName + "(" + nodedata.x + "," + nodedata.y + ",'" + nodedata.operator + "')");

        let conArr = opeNode.getAllConnectors();

        if (conArr.length === nodedata.conInfoArray.length) {
            for (let i = 0; i < conArr.length; ++i) {
                conArr[i].UniqueId = nodedata.conInfoArray[i].UniqueId;
            }
        } else {
            console.log("Unmatch Cons!!");
        }

        return opeNode;
    }

    loadNode(nodedata) {
        // console.log(nodedata);
        switch (nodedata.nodeName) {
            case "G_InputNode":
                return this.load_G_InputNode(nodedata);
                break;
            case "G_ReturnNode":
                return this.load_G_ReturnNode(nodedata);
                break;
            case "G_CallNode":
                return this.load_G_CallNode(nodedata);
                break;
            case "G_GetNode":
                return this.load_G_GetNode(nodedata);
                break;
            case "G_ConstNode":
                return this.load_G_ConstNode(nodedata);
                break;
            case "G_StandaloneNode":
                return this.load_G_StandaloneNode(nodedata);
                break;
            case "G_PrintfNode":
                return this.load_G_PrintfNode(nodedata);
                break;
            case "G_SetNode":
                return this.load_G_SetNode(nodedata);
                break;
            case "G_Binary_operator_Widget":
                return this.load_G_Binary_operator_Widget(nodedata);
                break;
            case "G_Unary_operator_Widget":
                return this.load_G_G_Unary_operator_Widget(nodedata);
                break;
            case "G_Statement_Widget":
                return this.load_G_G_Statement_Widget(nodedata);
                break;
            default:
                console.log(nodedata.nodeName);
                break;
        }
    }
}

let nodeLoader = new NodeLoader();

//--------------------
let TypeManager = new Type_Manager();

let coderoot = new Object();

coderoot.M_Variables = [];
coderoot.M_Functions = [];
coderoot.M_Projects = [];
coderoot.Current_Function = null;

coderoot.code_bar_svg = $("#code_bar_svg")[0];
coderoot.code_menu_svg = $("#code_menu_svg")[0];
coderoot.code_detail_svg = $("#code_detail_svg")[0];
coderoot.code_top_svg = $("#code_top_svg")[0];
coderoot.code_exp_svg = $("#code_exp_svg")[0];
coderoot.code_project_svg = $("#code_project_svg")[0];
coderoot.code_bottom_svg = $("#code_bottom_svg")[0];
coderoot.code_workarea_svg = $("#code_workarea_svg")[0];

coderoot.exp_widget = new G_Exp_Widget();
coderoot.project_widget = new G_Project_Widget();
coderoot.menu_bar = new G_Menu_Bar();
coderoot.menu_widget = new G_Menu_Widget();
coderoot.detail_widget = new G_Detail_Widget();
coderoot.top_widget = new G_Top_Widget();
coderoot.bottom_widget = new G_Bottom_Widget();
coderoot.workarea_widget = new G_Workarea_Widget();

coderoot.toJsonData = function () {
    let obj = new Object();

    obj.menu_widget = coderoot.menu_widget.toJsonData();


    obj.M_Structs = TypeManager.toJsonData();
    obj.M_Variables = [];
    obj.M_Functions = [];

    for (let i = 0; i < this.M_Variables.length; ++i) {
        obj.M_Variables.push(this.M_Variables[i].toJsonData());
    }

    for (let i = 0; i < this.M_Functions.length; ++i) {
        obj.M_Functions.push(this.M_Functions[i].toJsonData());
    }

    return obj;
}

function loadStruct(data) {
    var newData = new M_Struct("struct", data.dataType, "var", TypeManager.baseTypeArray);
    newData.varNamePrefix = data.varNamePrefix;
    newData.varNameIndex = data.varNameIndex;
    newData.color = data.color;

    newData.setBelongArray(TypeManager.baseTypeArray);
    TypeManager.baseTypeArray.push(newData);

    for (let i = 0; i < TypeManager.baseTypeArray.remindClass.length; ++i) {
        TypeManager.baseTypeArray.remindClass[i].updateChildWidgets();
    }

    let varArr = [];
    for (let j = 0; j < data.memberVariableArr.length; ++j) {
        let varPair = loadVariable(data.memberVariableArr[j], newData.memberVariableArr);
        varArr.push(varPair);
    }

    return varArr;

}

function loadVariable(data, _belongArray) {
    let newData = TypeManager.getBaseTypeVariable();
    newData.UniqueId = data.UniqueId;
    newData.bPointer = data.bPointer;
    newData.selectDataType(data.dataType);
    newData.setIdentifier(data.identifier);
    newData.setBelongArray(_belongArray);
    _belongArray.push(newData);

    for (let i = 0; i < _belongArray.remindClass.length; ++i) {
        _belongArray.remindClass[i].updateChildWidgets();
    }

    return { "obj": newData, "info": data };
}

function loadFunction(data) {
    let inputArr = [];
    let returnArr = [];
    let variableArr = [];

    for (let i = 0; i < data.inputJsonData.length; ++i) {
        let newVarData = data.inputJsonData[i];

        let defaultVar = TypeManager.getBaseTypeVariable();
        defaultVar.bPointer = newVarData.bPointer;
        defaultVar.UniqueId = newVarData.UniqueId;
        defaultVar.setIdentifier(newVarData.identifier);
        defaultVar.selectDataType(newVarData.dataType);

        inputArr.push(defaultVar);
    }

    for (let j = 0; j < data.returnJsonData.length; ++j) {
        let newVarData = data.returnJsonData[j];

        let defaultVar = TypeManager.getBaseTypeVariable();
        defaultVar.bPointer = newVarData.bPointer;
        defaultVar.UniqueId = newVarData.UniqueId;
        defaultVar.setIdentifier(newVarData.identifier);
        defaultVar.selectDataType(newVarData.dataType);

        returnArr.push(defaultVar);
    }

    for (let k = 0; k < data.variableJsonData.length; ++k) {
        let newVarData = data.variableJsonData[k];

        let defaultVar = TypeManager.getBaseTypeVariable();
        defaultVar.bPointer = newVarData.bPointer;
        defaultVar.UniqueId = newVarData.UniqueId;
        defaultVar.setIdentifier(newVarData.identifier);
        defaultVar.selectDataType(newVarData.dataType);

        variableArr.push(defaultVar);
    }

    newData = new M_Function(data.name, inputArr, returnArr, variableArr);
    newData.UniqueId = data.UniqueId;
    newData.setBelongArray(coderoot.M_Functions);
    newData.nodeJsonDataArray = data.nodeJsonDataArray;
    coderoot.M_Functions.push(newData);

    for (let i = 0; i < coderoot.M_Functions.remindClass.length; ++i) {
        coderoot.M_Functions.remindClass[i].updateChildWidgets();
    }
}

function loadMenuWidget(data) {
    coderoot.menu_widget.GlobalStructsWidget.varNamePrefix = data.GlobalStructsWidget.varNamePrefix;
    coderoot.menu_widget.GlobalStructsWidget.varNameIndex = data.GlobalStructsWidget.varNameIndex;

    coderoot.menu_widget.GlobalVariablesWidget.varNamePrefix = data.GlobalVariablesWidget.varNamePrefix;
    coderoot.menu_widget.GlobalVariablesWidget.varNameIndex = data.GlobalVariablesWidget.varNameIndex;

    coderoot.menu_widget.GlobalFunctionsWidget.varNamePrefix = data.GlobalFunctionsWidget.varNamePrefix;
    coderoot.menu_widget.GlobalFunctionsWidget.varNameIndex = data.GlobalFunctionsWidget.varNameIndex;
}

function loadproject(data) {

    if (Object.keys(data).length === 0 && data.constructor === Object) {
        console.log("empty");
        return;
    }
    // console.log(data);

    loadMenuWidget(data.menu_widget);
    let Structs = data.M_Structs;
    let variables = data.M_Variables;
    let functions = data.M_Functions;

    // console.log(Structs);

    let varArr = [];
    for (let i = 0; i < Structs.length; ++i) {
        let varPair = loadStruct(Structs[i]);
        varArr.push(...varPair);
    }

    // selectDataType again to get the post-defined type //!!!!!!!!!!
    for (let i = 0; i < varArr.length; ++i) {
        varArr[i].obj.selectDataType(varArr[i].info.dataType);
    }


    for (let j = 0; j < variables.length; ++j) {
        loadVariable(variables[j], coderoot.M_Variables);
    }

    for (let k = 0; k < functions.length; ++k) {
        loadFunction(functions[k]);
    }
}

function Generate_Structs_Codes() {
    let expressions = [];

    let structs = TypeManager.baseTypeArray.filter(ele => ele instanceof M_Struct);

    for (let i = 0; i < structs.length; ++i) {
        expressions.push(...structs[i].CCodeDeclaration());
    }
    expressions.push("\n");

    for (let i = 0; i < structs.length; ++i) {
        expressions.push(...structs[i].CCodeDefinition());
        expressions.push("\n");
    }

    return expressions;
}

function Generate_Global_Variables_Codes() {
    let expressions = [];

    for (let i = 0; i < coderoot.M_Variables.length; ++i) {
        expressions.push(...coderoot.M_Variables[i].CCodeDefinition());
    }
    expressions.push("\n");

    return expressions;
}

function Generate_Function_Declaration_Codes() {
    let expressions = [];

    for (let i = 0; i < coderoot.M_Functions.length; ++i) {
        expressions.push(...coderoot.M_Functions[i].CCodeDeclaration());
    }
    expressions.push("\n");

    return expressions;
}

function Generate_One_Function_Body_Codes(_func) {
    if (coderoot.Current_Function) {
        coderoot.detail_widget.unloadFunction();
        coderoot.workarea_widget.unloadFunction();
    }

    coderoot.detail_widget.loadFunction(_func);
    coderoot.workarea_widget.loadFunction(_func);

    let expressions = [];

    let CCodeDeclaration = _func.CCodeDeclaration()[0];
    let exp = CCodeDeclaration.substring(0, CCodeDeclaration.length - 1) + "{";
    expressions.push(exp);

    let nextNode = _func.getInputNode();

    while (nextNode) {
        expressions.push(...nextNode.generateCCode());
        nextNode = _func.GetNextNode(nextNode);
    }
    expressions.push("\n");

    return expressions;
}

function Generate_Function_Body_Codes() {
    let currentFunc = coderoot.Current_Function;

    let expressions = [];

    for (let i = 0; i < coderoot.M_Functions.length; ++i) {
        expressions.push(...Generate_One_Function_Body_Codes(coderoot.M_Functions[i]));
    }

    if (coderoot.Current_Function) {
        coderoot.detail_widget.unloadFunction();
        coderoot.workarea_widget.unloadFunction();
    }

    if (currentFunc && coderoot.M_Functions.includes(currentFunc)) {

        coderoot.detail_widget.loadFunction(currentFunc);
        coderoot.workarea_widget.loadFunction(currentFunc);
    }

    return expressions;
}

function GenerateCode() {
    console.log("<--------- GenerateCode --------->");
    let expressions = [];

    expressions.push("#include <stdio.h>");
    expressions.push("#include <stdlib.h>\n");

    expressions.push("#define uchar unsigned char");
    expressions.push("#define ushort unsigned short");
    expressions.push("#define uint unsigned int");
    expressions.push("#define ulong unsigned long\n");

    expressions.push(...Generate_Structs_Codes());
    expressions.push(...Generate_Global_Variables_Codes());
    expressions.push(...Generate_Function_Declaration_Codes());
    expressions.push(...Generate_Function_Body_Codes());

    // console.log(expressions.join("\n"));

    // $("#code_textarea").html(expressions.join("\n"));
    aniCode(expressions.join("\n"));

    return expressions.join("\n");
}

function aniCode(data){
    let arr = data.split("");
    // console.log(arr);


    for(let i = 0;i<arr.length;++i){
        setTimeout(() => {
            $("#code_textarea").append(arr[i]);
            document.getElementById("code_textarea").scrollTop = document.getElementById("code_textarea").scrollHeight;
        }, i*5);
        
    }
    // $("#code_textarea").html(data);
}

let webSocket = new WebSocket("ws://localhost:8081");

webSocket.onopen = function () {
    // webSocket.send("");
    console.log("%csocket open", "color: green");
};

webSocket.onmessage = function (e) {
    let recv_msg = e.data;
    let jsonObj = JSON.parse(recv_msg);
    switch (jsonObj.cmd) {
        case "loadProject":
            loadProject(jsonObj.data);
            break;
        case "listProjects":
            listProjects(jsonObj.data);
            break;
        case "loadProjectConf":
            loadProjectConf(jsonObj.data);
            break;
        case "stdout":
            stdout(jsonObj.data);
            break;
    }
};

function listProjects(data) {
    $(coderoot.code_project_svg).css("display", "block");
    for (let i = 0; i < data.length; ++i) {
        let newData = new M_Project(data[i]);
        newData.setBelongArray(coderoot.M_Projects);

        coderoot.project_list.addNewObjectToBindingArray(newData);
    }
    $(coderoot.code_project_svg).css("display", "none");
}

function loadProjectConf(data) {
    coderoot.project_list.varNamePrefix = data.varNamePrefix;
    coderoot.project_list.varNameIndex = data.varNameIndex;
}

function cleanProject() {
    let structTypeArray = TypeManager.baseTypeArray.filter(ele => ele instanceof M_Struct);

    for (let i = coderoot.M_Functions.length - 1; i >= 0; --i) {
        coderoot.M_Functions[i].delete();
    }

    for (let i = coderoot.M_Variables.length - 1; i >= 0; --i) {
        coderoot.M_Variables[i].delete();
    }

    // let darr = [];

    for (let i = structTypeArray.length - 1; i >= 0; --i) {
    // for (let i = 0; i <structTypeArray.length; ++i) {
        structTypeArray[i].delete();
        // darr.push(structTypeArray[i]);
    }

    // for (let i = 0; i <darr.length; ++i) {
    //     console.log(darr[i].dataType);
    //     darr[i].delete();
    // }

    coderoot.workarea_widget.cleanExistingWidgets();
}

function loadProject(data) {
    cleanProject();
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        console.log("empty");
        return;
    }
    // console.log(data);

    loadMenuWidget(data.menu_widget);
    let Structs = data.M_Structs;
    let variables = data.M_Variables;
    let functions = data.M_Functions;

    // console.log(Structs);

    let varArr = [];
    for (let i = 0; i < Structs.length; ++i) {
        let varPair = loadStruct(Structs[i]);
        varArr.push(...varPair);
    }

    // selectDataType again to get the post-defined type //!!!!!!!!!!
    for (let i = 0; i < varArr.length; ++i) {
        varArr[i].obj.selectDataType(varArr[i].info.dataType);
    }


    for (let j = 0; j < variables.length; ++j) {
        loadVariable(variables[j], coderoot.M_Variables);
    }

    for (let k = 0; k < functions.length; ++k) {
        loadFunction(functions[k]);
    }
}

function stdout(data){
    let arr = data.split("");

    for(let i = 0;i<arr.length;++i){
        setTimeout(() => {
            $("#stdout_textarea").append(arr[i]);
            document.getElementById("code_textarea").scrollTop = document.getElementById("code_textarea").scrollHeight;
        }, i*10);
        
    }
    // $("#stdout_textarea").html(data);
}

webSocket.onclose = function () {
    console.log("%csocket close", "color: red");
};

$(document).on("keydown", function (event) {
    if (event.key === "Backspace") {
        coderoot.workarea_widget.deleteSelectedWidget();
    }
});

