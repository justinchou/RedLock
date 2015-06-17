#include <node.h>
#include <v8.h>
using namespace v8;

#include "sleep.h"

void SleepFunc(const v8::FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  double arg0 = args[0] -> NumberValue();
  MySleep(arg0);
}
void USleepFunc(const v8::FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);
  double arg0 = args[0] -> NumberValue();
  MyUSleep(arg0);
}
void Init(Handle<Object> exports) {
  Isolate* isolate = Isolate::GetCurrent();
  exports->Set(String::NewFromUtf8(isolate, "sleep"),
      FunctionTemplate::New(isolate, SleepFunc)->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "usleep"),
      FunctionTemplate::New(isolate, USleepFunc)->GetFunction());
}
NODE_MODULE(hello, Init);
