#!/bin/bash
isExistApp=`ps -eaf |grep cp-salesforce-service |grep -v grep| awk '{ print $2; }'`
if [[ -n $isExistApp ]]; then
    service cp-salesforce-service stop
fi

service cp-salesforce-service start
