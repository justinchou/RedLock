#ifdef WIN32
#include <windows.h>

void MySleep(unsigned seconds) {
    Sleep(seconds);
}

void MyUSleep(unsigned seconds) {
    Sleep(seconds / 1000000);
}

#else
#include <unistd.h>

void MySleep(unsigned seconds) {
    sleep(seconds);
}

void MyUSleep(unsigned seconds) {
    usleep(seconds);
}

#endif


