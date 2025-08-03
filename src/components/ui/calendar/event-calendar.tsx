import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Event } from '@/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { isSameDay, format } from 'date-fns';

export type EventCalendarProps = React.ComponentProps<typeof DayPicker> & {
  events?: Event[];
  onEventClick?: (event: Event) => void;
  pcMode?: boolean;
};

// This function creates event markers and identifiers for calendar days
function EventMarkers({ date, events, onEventClick, pcMode = false }: { 
  date: Date; 
  events: Event[]; 
  onEventClick?: (event: Event) => void;
  pcMode?: boolean;
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Find events for this day
  const dayEvents = events.filter(
    (event) =>
      isSameDay(event.startDate, date) ||
      isSameDay(event.endDate, date) ||
      (date >= event.startDate && date <= event.endDate)
  );

  if (dayEvents.length === 0) return null;

  // Group events by multi-day and single-day
  const multiDayEvents = dayEvents.filter(event => !isSameDay(event.startDate, event.endDate));
  const singleDayEvents = dayEvents.filter(event => isSameDay(event.startDate, event.endDate));
  
  // Limit events based on PC or mobile mode
  // In PC mode, show more events
  const multiDayLimit = pcMode ? 3 : 2;
  const singleDayLimit = pcMode ? 4 : 3;
  
  // Limit single day events based on mode
  const visibleSingleDayEvents = singleDayEvents.slice(0, singleDayLimit);
  // Limit multi-day events based on mode
  const visibleMultiDayEvents = multiDayEvents.slice(0, multiDayLimit);
  
  const totalVisibleEvents = visibleSingleDayEvents.length + visibleMultiDayEvents.length;
  const hasMoreEvents = dayEvents.length > totalVisibleEvents;

  return (
    <div 
      className="absolute left-0 right-0 flex flex-col"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Multi-day events with names */}
      {visibleMultiDayEvents.length > 0 && (
        <div className="mb-1">
          {visibleMultiDayEvents.map((event, index) => {
            // Determine if this is the start, middle, or end of the multi-day event
            const isStartDay = isSameDay(event.startDate, date);
            const isEndDay = isSameDay(event.endDate, date);
            const isMiddleDay = !isStartDay && !isEndDay;
            
            return (
              <div
                key={`multi-${event.id}`}
                className={`truncate px-1 py-[1px] cursor-pointer mb-[2px] text-white
                  ${isStartDay ? 'rounded-l-sm' : ''}
                  ${isEndDay ? 'rounded-r-sm' : ''}
                  ${isMiddleDay ? 'rounded-none' : ''}
                `}
                style={{ 
                  backgroundColor: event.color || '#3b82f6',
                  marginLeft: isStartDay ? '1px' : '-1px', // Connect to previous day
                  marginRight: isEndDay ? '1px' : '-1px',  // Connect to next day
                  width: isMiddleDay ? 'calc(100% + 2px)' : isStartDay || isEndDay ? 'calc(100% + 1px)' : '100%', // Extend width to connect
                  fontSize: pcMode ? '8px' : '7px',
                  lineHeight: pcMode ? '12px' : '10px'
                }}
                title={event.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEventClick) onEventClick(event);
                }}
              >
                {event.title}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Single-day events with ribbons */}
      <div className="mb-1">
        {visibleSingleDayEvents.map((event, index) => (
          <div
            key={`single-${event.id}`}
            className="truncate px-1 py-[1px] cursor-pointer mb-[2px] text-white rounded-sm"
            style={{ 
              backgroundColor: event.color || '#3b82f6', 
              marginLeft: '1px', 
              marginRight: '1px',
              fontSize: pcMode ? '8px' : '7px',
              lineHeight: pcMode ? '12px' : '10px'
            }}
            title={event.title}
            onClick={(e) => {
              e.stopPropagation();
              if (onEventClick) onEventClick(event);
            }}
          >
            {event.title}
          </div>
        ))}
      </div>
      
      {/* Indicator for more events */}
      {hasMoreEvents && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center">
          <span className="text-[8px] text-muted-foreground">+{dayEvents.length - totalVisibleEvents}</span>
        </div>
      )}
      
      {/* Tooltip showing all events */}
      {showTooltip && dayEvents.length > 0 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-popover shadow-md rounded-md p-2 text-left w-max max-w-[200px]">
          <div className="max-h-[120px] overflow-y-auto">
            {dayEvents.map((event) => (
              <div 
                key={event.id} 
                className="text-[10px] mb-1 last:mb-0 flex items-center gap-1 cursor-pointer hover:bg-muted px-1 py-0.5 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEventClick) onEventClick(event);
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: event.color || '#3b82f6' }}
                />
                <span className="truncate">{event.title}</span>
                {!isSameDay(event.startDate, event.endDate) && (
                  <span className="text-[8px] text-muted-foreground ml-auto">
                    {format(event.startDate, 'MMM d')}-{format(event.endDate, 'MMM d')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCalendar({
  className,
  classNames,
  events = [],
  showOutsideDays = true,
  onEventClick,
  pcMode = false,
  ...props
}: EventCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full',
        month: 'space-y-4 w-full',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex w-full',
        head_cell: pcMode ? 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center' : 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: pcMode ? 'h-16 flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20' : 'h-14 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          pcMode ? 'h-9 w-full p-0 font-normal aria-selected:opacity-100' : 'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        DayContent: ({ date, ...dayContentProps }) => (
          <div className="relative w-full h-full flex flex-col">
            <div className="flex items-center justify-center pt-1 pb-2 z-10 relative">
              <div {...dayContentProps}>{format(date, 'd')}</div>
            </div>
            <div className="mt-2">
              {events && <EventMarkers date={date} events={events} onEventClick={onEventClick} pcMode={pcMode} />}
            </div>
          </div>
        ),
      }}
      {...props}
    />
  );
}
EventCalendar.displayName = 'EventCalendar';

export { EventCalendar };