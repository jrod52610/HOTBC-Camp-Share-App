#!/bin/bash
# Backup the file
cp /workspace/shadcn-ui/src/pages/Calendar.tsx /workspace/shadcn-ui/src/pages/Calendar.tsx.bak

# Edit the first occurrence (PC view)
sed -i '447,458c\
                          <div className="flex flex-wrap gap-2 mt-2">\
                            {event.category && (\
                              <Badge \
                                variant="outline" \
                                className="text-[11px] h-5 capitalize"\
                              >\
                                {event.category}\
                              </Badge>\
                            )}\
                            {event.category === "retreat" && event.cateringNeeded && (\
                              <Badge \
                                variant="secondary"\
                                className="text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"\
                              >\
                                Catering\
                              </Badge>\
                            )}\
                          </div>' /workspace/shadcn-ui/src/pages/Calendar.tsx

# Edit the second occurrence (Mobile view)
sed -i '541,552c\
                          <div className="flex flex-wrap gap-2 mt-2">\
                            {event.category && (\
                              <Badge \
                                variant="outline" \
                                className="text-[11px] h-5 capitalize"\
                              >\
                                {event.category}\
                              </Badge>\
                            )}\
                            {event.category === "retreat" && event.cateringNeeded && (\
                              <Badge \
                                variant="secondary"\
                                className="text-[11px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100"\
                              >\
                                Catering\
                              </Badge>\
                            )}\
                          </div>' /workspace/shadcn-ui/src/pages/Calendar.tsx

# Also update the EditEventDialog.tsx to include catering badge display
grep -q "Catering" /workspace/shadcn-ui/src/components/EditEventDialog.tsx
if [ $? -ne 0 ] && [ -f /workspace/shadcn-ui/src/components/EditEventDialog.tsx ]; then
  echo "Updating EditEventDialog.tsx to show catering badge..."
  # Add more code here if needed to update EditEventDialog.tsx
fi

echo "Updates completed!"
