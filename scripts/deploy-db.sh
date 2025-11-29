#!/bin/bash

# Wordle Pwincess - Database Deployment Script
# This script handles database export from local and import to Railway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Local MySQL configuration
LOCAL_MYSQL="/usr/local/mysql/bin/mysql"
LOCAL_MYSQLDUMP="/usr/local/mysql/bin/mysqldump"
LOCAL_HOST="127.0.0.1"
LOCAL_USER="root"
LOCAL_DB="wordleapp"

# Railway MySQL configuration
RAILWAY_HOST="tramway.proxy.rlwy.net"
RAILWAY_PORT="12914"
RAILWAY_USER="root"
RAILWAY_DB="railway"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DUMP_FILE="$SCRIPT_DIR/wordleapp_dump.sql"
CLEAN_DUMP_FILE="$SCRIPT_DIR/wordleapp_dump_clean.sql"

echo -e "${YELLOW}=== Wordle Pwincess Database Deployment ===${NC}"

# Function to prompt for password
get_password() {
    local prompt="$1"
    local password
    read -s -p "$prompt" password
    echo "$password"
}

# Check if we should export, import, or both
case "$1" in
    export)
        echo -e "\n${GREEN}Exporting local database...${NC}"
        echo -n "Enter LOCAL MySQL password: "
        LOCAL_PASS=$(get_password "")
        echo ""

        $LOCAL_MYSQLDUMP -u "$LOCAL_USER" -p"$LOCAL_PASS" -h "$LOCAL_HOST" "$LOCAL_DB" > "$DUMP_FILE" 2>&1 | grep -v "Warning"

        # Remove any warning lines from the dump
        grep -v "^\[Warning\]" "$DUMP_FILE" | grep -v "^mysqldump:" > "$CLEAN_DUMP_FILE"
        mv "$CLEAN_DUMP_FILE" "$DUMP_FILE"

        echo -e "${GREEN}Export complete! Dump saved to: $DUMP_FILE${NC}"
        ;;

    import)
        echo -e "\n${GREEN}Importing to Railway...${NC}"
        echo -n "Enter RAILWAY MySQL password: "
        RAILWAY_PASS=$(get_password "")
        echo ""

        # Clean dump file if needed
        if head -1 "$DUMP_FILE" | grep -q "Warning\|mysqldump"; then
            echo -e "${YELLOW}Cleaning dump file...${NC}"
            tail -n +2 "$DUMP_FILE" > "$CLEAN_DUMP_FILE"
            IMPORT_FILE="$CLEAN_DUMP_FILE"
        else
            IMPORT_FILE="$DUMP_FILE"
        fi

        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" < "$IMPORT_FILE" 2>&1 | grep -v "Warning"

        echo -e "${GREEN}Import complete!${NC}"

        # Verify tables
        echo -e "\n${YELLOW}Verifying tables in Railway:${NC}"
        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
        ;;

    sync)
        echo -e "\n${GREEN}Full sync: Export local -> Import to Railway${NC}"
        echo -n "Enter LOCAL MySQL password: "
        LOCAL_PASS=$(get_password "")
        echo ""
        echo -n "Enter RAILWAY MySQL password: "
        RAILWAY_PASS=$(get_password "")
        echo ""

        # Export
        echo -e "\n${YELLOW}Step 1: Exporting local database...${NC}"
        $LOCAL_MYSQLDUMP -u "$LOCAL_USER" -p"$LOCAL_PASS" -h "$LOCAL_HOST" "$LOCAL_DB" 2>&1 | grep -v "Warning" > "$DUMP_FILE"

        # Clean
        if head -1 "$DUMP_FILE" | grep -q "Warning\|mysqldump"; then
            tail -n +2 "$DUMP_FILE" > "$CLEAN_DUMP_FILE"
        else
            cp "$DUMP_FILE" "$CLEAN_DUMP_FILE"
        fi

        # Import
        echo -e "${YELLOW}Step 2: Importing to Railway...${NC}"
        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" < "$CLEAN_DUMP_FILE" 2>&1 | grep -v "Warning"

        echo -e "\n${GREEN}Sync complete!${NC}"

        # Verify
        echo -e "\n${YELLOW}Tables in Railway:${NC}"
        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
        ;;

    verify)
        echo -e "\n${GREEN}Verifying Railway database...${NC}"
        echo -n "Enter RAILWAY MySQL password: "
        RAILWAY_PASS=$(get_password "")
        echo ""

        echo -e "\n${YELLOW}Tables:${NC}"
        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" -e "SHOW TABLES;" 2>&1 | grep -v "Warning"

        echo -e "\n${YELLOW}User count:${NC}"
        $LOCAL_MYSQL -h "$RAILWAY_HOST" -P "$RAILWAY_PORT" -u "$RAILWAY_USER" -p"$RAILWAY_PASS" "$RAILWAY_DB" -e "SELECT COUNT(*) as user_count FROM users;" 2>&1 | grep -v "Warning"
        ;;

    *)
        echo -e "${RED}Usage: $0 {export|import|sync|verify}${NC}"
        echo ""
        echo "Commands:"
        echo "  export  - Export local database to dump file"
        echo "  import  - Import dump file to Railway"
        echo "  sync    - Export local and import to Railway (full sync)"
        echo "  verify  - Check Railway database tables"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done! 💅${NC}"
