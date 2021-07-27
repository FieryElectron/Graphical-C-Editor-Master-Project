#include <stdio.h>
#include <stdlib.h>

#define uchar unsigned char
#define ushort unsigned short
#define uint unsigned int
#define ulong unsigned long





int main();
int Add(int var3, int var4);


int main(){
int var0;
int var1;
int var2;
var1 = 5;
var2 = 6;
printf("%d\n",Add(var1, var2));
return var0;
}


int Add(int var3, int var4){
int var0;
int var1;
int var2;
var0 = (var3 + var4);
return var0;
}

