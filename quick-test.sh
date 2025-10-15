#!/bin/bash

# 快速测试脚本
# 用于自动测试前后端功能

echo "🧪 开始自动测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASS=0
FAIL=0

# 测试函数
test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=$4
  
  echo -n "测试: $name ... "
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null)
  else
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗ 失败${NC} (HTTP $http_code)"
    echo "  响应: $body"
    ((FAIL++))
    return 1
  fi
}

# 1. 检查后端是否运行
echo "📡 检查后端服务..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo -e "${RED}❌ 后端服务未运行！${NC}"
  echo ""
  echo "请先启动后端："
  echo "  cd packages/server"
  echo "  pnpm start:dev"
  exit 1
fi

echo -e "${GREEN}✓ 后端服务运行中${NC}"
echo ""

# 2. 测试健康检查
echo "🏥 测试健康检查..."
test_endpoint "健康检查" "http://localhost:3000/api/health"
echo ""

# 3. 测试注册（使用随机邮箱避免冲突）
echo "👤 测试用户注册..."
RANDOM_EMAIL="test$(date +%s)@example.com"
RANDOM_USER="user$(date +%s)"

REGISTER_DATA='{
  "email": "'$RANDOM_EMAIL'",
  "username": "'$RANDOM_USER'",
  "password": "123456"
}'

if test_endpoint "用户注册" "http://localhost:3000/api/trpc/auth.register" "POST" "$REGISTER_DATA"; then
  # 提取 token（简单处理，实际可能需要 jq）
  TOKEN=$(curl -s -X POST "http://localhost:3000/api/trpc/auth.register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -n "$TOKEN" ]; then
    echo "  Token: ${TOKEN:0:20}..."
  fi
fi
echo ""

# 4. 测试登录
echo "🔐 测试用户登录..."
LOGIN_DATA='{
  "identifier": "'$RANDOM_EMAIL'",
  "password": "123456"
}'

test_endpoint "用户登录" "http://localhost:3000/api/trpc/auth.login" "POST" "$LOGIN_DATA"
echo ""

# 5. 测试受保护路由（需要 token）
if [ -n "$TOKEN" ]; then
  echo "🛡️ 测试受保护路由..."
  echo -n "测试: 获取当前用户 ... "
  
  response=$(curl -s -w "\n%{http_code}" "http://localhost:3000/api/trpc/auth.me" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
    ((PASS++))
  else
    echo -e "${RED}✗ 失败${NC} (HTTP $http_code)"
    ((FAIL++))
  fi
  echo ""
fi

# 6. 测试错误处理
echo "⚠️ 测试错误处理..."

# 测试重复注册
DUPLICATE_DATA='{
  "email": "'$RANDOM_EMAIL'",
  "username": "anotheruser",
  "password": "123456"
}'

echo -n "测试: 重复邮箱注册 ... "
response=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3000/api/trpc/auth.register" \
  -H "Content-Type: application/json" \
  -d "$DUPLICATE_DATA" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "409" ] || echo "$response" | grep -q "已被注册"; then
  echo -e "${GREEN}✓ 通过${NC} (正确拒绝重复邮箱)"
  ((PASS++))
else
  echo -e "${RED}✗ 失败${NC} (应该拒绝重复邮箱)"
  ((FAIL++))
fi
echo ""

# 7. 测试错误登录
echo -n "测试: 错误密码登录 ... "
WRONG_LOGIN='{
  "identifier": "'$RANDOM_EMAIL'",
  "password": "wrongpassword"
}'

response=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3000/api/trpc/auth.login" \
  -H "Content-Type: application/json" \
  -d "$WRONG_LOGIN" 2>/dev/null)

http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || echo "$response" | grep -q "密码错误"; then
  echo -e "${GREEN}✓ 通过${NC} (正确拒绝错误密码)"
  ((PASS++))
else
  echo -e "${RED}✗ 失败${NC} (应该拒绝错误密码)"
  ((FAIL++))
fi
echo ""

# 测试总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "总测试数: $((PASS + FAIL))"
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 有 $FAIL 个测试失败${NC}"
  exit 1
fi

