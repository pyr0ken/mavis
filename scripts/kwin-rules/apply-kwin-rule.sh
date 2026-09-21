#!/usr/bin/env bash
# Apply Mavis KWin Sticky Window Rule on KDE Plasma

RULE_FILE="$(dirname "$0")/mavis.kwinrule"
KWIN_RULES_CONF="$HOME/.config/kwinrulesrc"

echo "Applying Mavis KRunner-style window rule to KDE Plasma..."

if [ -f "$KWIN_RULES_CONF" ]; then
    if grep -q "wmclass=mavis" "$KWIN_RULES_CONF"; then
        echo "Rule already exists in $KWIN_RULES_CONF."
    else
        echo "" >> "$KWIN_RULES_CONF"
        cat "$RULE_FILE" >> "$KWIN_RULES_CONF"
        echo "Appended Mavis rule to $KWIN_RULES_CONF."
        # Reload KWin rules if qdbus is available
        if command -v qdbus &> /dev/null; then
            qdbus org.kde.KWin /KWin reconfigure 2>/dev/null || true
        fi
    fi
else
    mkdir -p "$HOME/.config"
    cat "$RULE_FILE" > "$KWIN_RULES_CONF"
    echo "Created $KWIN_RULES_CONF with Mavis rule."
fi

echo "Done. Mavis is configured as a sticky, omnipresent system overlay on KDE Plasma."
