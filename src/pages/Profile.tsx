import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, UserCircle, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfilePage() {
  const { currentUser, updateProfile, logout, error } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateProfile = () => {
    if (name.trim() && currentUser) {
      updateProfile({ name: name.trim() });
      setIsEditing(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <MobileLayout title="My Profile">
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <UserCircle className="h-20 w-20 text-primary" />
              
              {isEditing ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setName(currentUser.name);
                        setIsEditing(false);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateProfile}
                      className="flex-1"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-xl font-bold">{currentUser.name}</h2>
                  <p className="text-muted-foreground">{currentUser.phoneNumber}</p>
                  
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {currentUser.permissions.map(permission => (
                      <span 
                        key={permission} 
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          permission === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : permission === 'maintenance'
                            ? 'bg-blue-100 text-blue-800'
                            : permission === 'cleaning'
                            ? 'bg-green-100 text-green-800'
                            : permission === 'calendar'
                            ? 'bg-amber-100 text-amber-800'
                            : permission === 'chef'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="mt-4"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </MobileLayout>
  );
}