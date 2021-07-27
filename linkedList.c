#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct node Node;
    
typedef struct node {
	int data;
	Node* prev;
	Node* next;
}Node;

typedef struct list {
	Node* pHead;
	Node* pTail;
}List;

void init(List* ls) {
	ls->pHead = NULL;
	ls->pTail = NULL;
}

Node* createNode(int data, Node* prev, Node* next){
	Node* p = (Node*)malloc(sizeof(Node));
	p->data = data;
	p->prev = prev;
	p->next = next;
	return p;
}

void insert_end(List* ls, int data) {
	ls->pTail = createNode(data,ls->pTail,NULL);
    Node* tpTail;
    Node* tprev;
    tpTail = ls->pTail;
    tprev = tpTail->prev;

	if (tpTail->prev) {
		tprev->next = ls->pTail;
	} else {
		ls->pHead = ls->pTail;
	}
}

void insert_head(List* ls, int data) {
	ls->pHead =  createNode(data, NULL, ls->pHead);
	Node* tpHead;
    Node* tnext;
    tpHead = ls->pHead;
    tnext = tpHead->next;
	if (tpHead->next) {
		tnext->prev = ls->pHead;
	} else {
		ls->pTail = ls->pHead;
	}
}

int IsEmpty(List* ls) {
	return !ls->pHead && !ls->pTail;
}

void delete_pos(List* ls, int pos) {
    if (IsEmpty(ls)) {
		printf("List is empty!Undeletable!\n");
		return;
	}

    int index = 0;
    for (Node* p = ls->pHead;p;p = p->next) {
        if(index++ == pos){
			Node* prev = p->prev;
            Node* next = p->next;

            free(p);
            p = NULL;

			if (next) {
                next->prev = prev;
			}else {
				ls->pTail = prev;
			}

			if (prev) {
                prev->next = next;
			} else {
				ls->pHead = next;
			}
			break;
        }
	}
}

int GetSize(List* ls) {
	int size = 0;
	for (Node* p = ls->pHead;p;p = p->next) {
		++size;
	}
	return size;
}

void printList(List* ls){

    Node* p = ls->pHead;
    while(p){
        printf("%d ",p->data);
        p = p->next;
    }
	// for (Node* p = ls->pHead;p;p = p->next) {
	// 	printf("%d ",p->data);
	// }
    printf("\n");
}

int main() {
	List list;
	init(&list);

    insert_end(&list, 0);
    insert_end(&list, 1);
    insert_end(&list, 2);
    insert_end(&list, 3);
    insert_end(&list, 4);
    printList(&list);

    delete_pos(&list, 2);
    printList(&list);

	return 0;
}