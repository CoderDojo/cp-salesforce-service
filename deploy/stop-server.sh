#!/bin/bash
isExistApp=`pgrep cp-salesforce-service`
if [[ -n $isExistApp ]]; then
  service cp-salesforce-service stop
fi
