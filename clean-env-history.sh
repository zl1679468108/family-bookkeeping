#!/bin/bash
# 从 git 历史中清除所有敏感的 .env 文件
FILES="backend/.env.development backend/.env.production frontend/.env.development frontend/.env.production taro/.env.development"
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch $FILES" \
  --prune-empty --tag-name-filter cat -- --all
