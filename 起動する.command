#!/bin/bash
# Move to the directory where this script is located
cd "$(dirname "$0")"

echo "========================================="
echo "   王将出陣 - 将棋スライドパズル 起動中"
echo "========================================="
echo ""
echo "ブラウザを自動で開きます..."
echo "終了するときはこのウィンドウを閉じるか [Ctrl + C] を押してください。"
echo ""

# Open browser after a brief delay
(sleep 1 && open "http://localhost:5173") &

# Start dev server
npm run dev
