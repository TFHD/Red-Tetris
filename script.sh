#!/bin/bash

IP=$(ifconfig eno2 | grep 'inet ' | awk '{print $2}')
sed -i "s/^ADDRESS=.*/ADDRESS=$IP/" ".env"
