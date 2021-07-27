#include <stdio.h>
#include <stdlib.h>

#define uchar unsigned char
#define ushort unsigned short
#define uint unsigned int
#define ulong unsigned long

typedef struct Node Node;
typedef struct List List;


typedef struct Node{
int data;
Node* prev;
Node* next;
}Node;


typedef struct List{
Node* pHead;
Node* pTail;
}List;




void init(List* ls);
Node* createNode(int data, Node* prev, Node* next);
void insertHead(List* ls, int data);
void insertTail(List* ls, int data);
int isEmpty(List* ls);
void deletePos(List* ls, int pos);
void printList(List* ls);
int main();


void init(List* ls){
ls->pTail = NULL;
ls->pHead = NULL;
}


Node* createNode(int data, Node* prev, Node* next){
Node* pout;
Node* p;
p = (Node*)malloc(sizeof(Node));
p->data = data;
p->prev = prev;
p->next = next;
pout = p;
return pout;
}


void insertHead(List* ls, int data){
Node* tpHead;
Node* tnext;
ls->pHead = createNode(data, NULL, ls->pHead);
tpHead = ls->pHead;
tnext = tpHead->next;
if(tpHead->next){
tnext->prev = ls->pHead;
}
else{
ls->pTail = ls->pHead;
}
}


void insertTail(List* ls, int data){
Node* tpTail;
Node* tprev;
ls->pTail = createNode(data, ls->pTail, NULL);
tpTail = ls->pTail;
tpTail = ls->pTail;
tprev = tpTail->prev;
if(tpTail->prev){
tprev->next = ls->pTail;
}
else{
ls->pHead = ls->pTail;
}
}


int isEmpty(List* ls){
int var0;
var0 = ((! ls->pHead) && (! ls->pTail));
return var0;
}


void deletePos(List* ls, int pos){
Node* p;
int index;
Node* prev;
Node* next;
int var0;
index = 0;
p = ls->pHead;
while(p){
if(((index ++) == pos)){
prev = p->prev;
next = p->next;
free(p);
p = NULL;
if(next){
next->prev = prev;
}
else{
ls->pTail = prev;
}
if(prev){
prev->next = next;
}
else{
ls->pHead = next;
}
break;
}
p = p->next;
}
}


void printList(List* ls){
Node* p;
p = ls->pHead;
while(p){
printf("%d ",p->data);
p = p->next;
}
printf("\n");
}


int main(){
int var0;
List list;
int count;
init((& list));
count = 0;
while(((count ++) < 10)){
insertHead((& list), count);
}
printList((& list));
deletePos((& list), 2);
printList((& list));
var0 = 0;
return var0;
}

