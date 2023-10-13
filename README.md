# sm64js2020archive

### Links
[Main Website: sm64js.com](https://sm64js2020archive.000webhostapp.com/)


## What is this?
This is an ongoing work-in-progress port of the decompilation of original Nintendo game, Super Mario 64, to native Javascript (no emulation or web assembly). The project involved creating a Javascript WebGL port of N64 Fast 3D Renderer, originally implemented with OpenGL in C.  This project also includes the development of online mass multiplayer versions of sm64js and other custom multiplayer game modes, And a 2020 working version of sm64js.

## Build instructions - Windows, Mac, or Linux
```bash
# Basic Steps (Getting the stuff you need for each OS)
On windows ubuntu do: cd /mnt/DRIVENAMEHERE for example if you have an E: drive do /mnt/e or if u only have C: drive do /mnt/c
On LINUX ubuntu type: Documents and go to your documents so that it can be ready to git clone.
For MAC Linux Virtual Machine/Windows Virtual Machine: If your on a linux virtual machine do this: Documents
If your on a windows virtual machine do: cd /mnt/c
Now that ur ready do the steps below!
If your on a windows computer: Download ubuntu from the microsoft store + Get the windows subsystem for linux.
If your on linux computer then you dont have to install ubuntu since your machine will already have it.
If your on a MAC computer you'll have get the "macOS / Intel hosts" build of virtualbox from their official website.
Then make an ubuntu terminal account (IT DOESNT HAVE TO BE YOUR LOGIN INFO ON YOUR COMPUTER!)


Build Steps
In the ubuntu terminal do: git clone https://github.com/sm64jsreboot/sm64jsrebooted.git (Stay in the drive or folder you want!)
Then do: cd sm64jsrebooted
After that do: git checkout betatesterversion
Then when its finished do the command in ubuntu: cd src
Then do these 2 commands.
Command 1: sudo apt update
Command 2: sudo apt install --no-install-recommends php8.1

Now while in the "src" folder do: php -S localhost:9300
                             
