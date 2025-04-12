#!/bin/bash

# This script helps you run SQL files against your Supabase database
# Usage: ./run-sql.sh <sql-file>

if [ $# -eq 0 ]; then
    echo "Usage: ./run-sql.sh <sql-file>"
    echo "Example: ./run-sql.sh database/opportunity_products.sql"
    exit 1
fi

SQL_FILE=$1

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: File $SQL_FILE does not exist."
    exit 1
fi

echo "=== SQL File Content ==="
cat "$SQL_FILE"
echo "======================="
echo ""
echo "To run this SQL file:"
echo "1. Log in to your Supabase account at https://app.supabase.io/"
echo "2. Select your project"
echo "3. Navigate to the SQL Editor in the left sidebar"
echo "4. Click 'New Query' to create a new SQL query"
echo "5. Copy and paste the content of the SQL file shown above"
echo "6. Click 'Run' to execute the script"
echo ""
echo "After running the SQL, restart your Angular application with 'ng serve'"
