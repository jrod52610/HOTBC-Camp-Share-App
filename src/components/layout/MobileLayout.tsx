import React, { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, Trash, Users, Menu, X, UserCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { NotificationCenter } from '@/components/NotificationCenter';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
}

export default function MobileLayout({ children, title }: MobileLayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const navItems = [
    { 
      name: 'Calendar', 
      path: '/', 
      icon: <CalendarDays className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Maintenance', 
      path: '/maintenance', 
      icon: <ClipboardList className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Cleaning', 
      path: '/cleaning', 
      icon: <Trash className="mr-2 h-5 w-5" /> 
    },
    { 
      name: 'Users', 
      path: '/users', 
      icon: <Users className="mr-2 h-5 w-5" /> 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex items-center justify-between py-2">
              <h2 className="text-lg font-semibold">Camp Share</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {currentUser && (
              <div className="py-3 border-b">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/profile');
                    setOpen(false);
                  }}
                >
                  <UserCircle className="mr-2 h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{currentUser.name}</span>
                    <span className="text-xs text-muted-foreground">{currentUser.email}</span>
                  </div>
                </Button>
              </div>
            )}
            <nav className="mt-6 flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={cn(
                    "justify-start",
                    location.pathname === item.path 
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                >
                  {item.icon}
                  {item.name}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-lg font-medium">{title}</h1>
        
        <NotificationCenter />
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-4 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white border-t shadow-md h-16 px-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className={cn(
              "flex flex-col items-center justify-center h-full py-1 px-2 w-1/4",
              location.pathname === item.path && "text-primary"
            )}
            onClick={() => navigate(item.path)}
          >
            {React.cloneElement(item.icon, { className: "h-5 w-5 mb-1" })}
            <span className="text-xs">{item.name}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}