#!/bin/bash
fuser -k 3000/tcp
fuser -k 5000/tcp

cd ./oj-server
# npm install
npm start &

cd ../oj-client
# npm install
ng build --watch &

cd ../executor
python executor_server.py


echo "---------------------------------"
read -p "PRESS any thing to terminate processes"

fuser -k 3000/tcp
fuser -k 5000/tcp