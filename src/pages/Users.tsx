import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, UserCircle, Shield, Trash2, Phone } from 'lucide-react';
import { Permission } from '@/types';
import { sendInvitationSms } from '@/utils/smsService';
import { useToast } from '@/components/ui/use-toast';
import { generateTemporaryCode } from '@/context/passwordUtils';

export default function UsersPage() {
  const { users, addUser, updateUserPermissions, deleteUser } = useAppContext();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [newUserName, setNewUserName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(['read-only']);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  // Check if current user is an admin
  const isAdmin = currentUser?.permissions?.includes('admin');

  const availablePermissions: { value: Permission; label: string }[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'maintenance', label: 'Maintenance Manager' },
    { value: 'cleaning', label: 'Cleaning Manager' },
    { value: 'calendar', label: 'Calendar Manager' },
    { value: 'chef', label: 'Chef (Catering Notifications)' },
    { value: 'read-only', label: 'Read Only' },
  ];

  const [newUserPhone, setNewUserPhone] = useState('');
  
  const handleAddUser = () => {
    if (newUserName.trim() && newUserPhone.trim()) {
      setIsAddingUser(true);
      
      // Generate a temporary verification code
      const tempCode = generateTemporaryCode();
      
      // Add the user first
      addUser({ 
        name: newUserName.trim(),
        phoneNumber: newUserPhone.trim(),
        permissions: selectedPermissions,
        passwordSet: false,
        temporaryCode: tempCode
      });
      
      // Then send the invitation SMS
      setIsSendingInvitation(true);
      sendInvitationSms(newUserPhone.trim(), newUserName.trim(), tempCode)
        .then((smsContent) => {
          // Display SMS in console for testing/demo purposes
          console.log("[DEMO SMS]", smsContent);
          
          toast({
            title: "Invitation sent!",
            description: `${newUserName} has been invited to join Camp Share.`,
            duration: 5000,
          });
        })
        .catch((error) => {
          console.error('Failed to send invitation:', error);
          toast({
            title: "Invitation error",
            description: "The user was added but we couldn't send the invitation SMS.",
            variant: "destructive",
            duration: 5000,
          });
        })
        .finally(() => {
          setIsAddingUser(false);
          setIsSendingInvitation(false);
          setNewUserName('');
          setNewUserPhone('');
          setSelectedPermissions(['read-only']);
        });
    }
  };

  const handleEditPermissions = (userId: string, currentPermissions: Permission[]) => {
    setEditingUser(userId);
    setSelectedPermissions([...(currentPermissions || [])]);
  };

  const handleSavePermissions = () => {
    if (editingUser) {
      updateUserPermissions(editingUser, selectedPermissions);
      setEditingUser(null);
    }
  };
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  return (
    <MobileLayout title="Users">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Camp Share Users</h2>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">User Name</Label>
                  <Input
                    id="name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter user name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>User Permissions</Label>
                  <div className="space-y-2">
                    {availablePermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`permission-${permission.value}`} 
                          checked={selectedPermissions?.includes(permission.value) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions(prev => [...(prev || []), permission.value]);
                            } else {
                              setSelectedPermissions(prev => (prev || []).filter(p => p !== permission.value));
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`permission-${permission.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {permission.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    onClick={handleAddUser}
                    disabled={isAddingUser || isSendingInvitation || !newUserName.trim() || !newUserPhone.trim()}
                  >
                    {isAddingUser || isSendingInvitation ? (
                      <>Adding User...</>
                    ) : (
                      <>Add User</>
                    )}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {users.map((user) => (
              <Card key={user.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {!user.passwordSet && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                                Invited
                              </span>
                            )}
                            {(user.permissions || []).map(permission => (
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
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Resend invitation button - only for users who haven't set a password */}
                        {!user.passwordSet && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                              // Generate new verification code
                              import('@/context/passwordUtils').then(({ generateTemporaryCode }) => {
                                const newTempCode = generateTemporaryCode();
                                
                                // Update user's temporary code
                                const updatedUsers = users.map(u => 
                                  u.id === user.id ? { ...u, temporaryCode: newTempCode } : u
                                );
                                localStorage.setItem('campshare-users', JSON.stringify(updatedUsers));
                                
                                // Resend invitation SMS
                                sendInvitationSms(user.phoneNumber, user.name, newTempCode)
                                  .then((smsContent) => {
                                    // Display SMS in console for testing/demo purposes
                                    console.log("[DEMO SMS RESENT]", smsContent);
                                    
                                    toast({
                                      title: "Invitation resent!",
                                      description: `A new invitation has been sent to ${user.name}.`,
                                      duration: 5000,
                                    });
                                  })
                                  .catch((error) => {
                                    console.error('Failed to resend invitation:', error);
                                    toast({
                                      title: "Invitation error",
                                      description: "We couldn't resend the invitation SMS.",
                                      variant: "destructive",
                                      duration: 5000,
                                    });
                                  });
                              });
                            }}
                          >
                            <Phone className="h-4 w-4" />
                            Resend Invitation
                          </Button>
                        )}
                        
                        {/* Permissions button */}
                        <Dialog onOpenChange={(open) => {
                          if (open) {
                            // Set editing user and load their current permissions when dialog opens
                            setEditingUser(user.id);
                            setSelectedPermissions([...(user.permissions || [])]);
                          } else {
                            // Reset when dialog closes without saving
                            setEditingUser(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Shield className="h-4 w-4" />
                              Permissions
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Permissions for {user.name}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="space-y-2">
                                {availablePermissions.map((permission) => (
                                  <div key={permission.value} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={`permission-${user.id}-${permission.value}`} 
                                      checked={selectedPermissions?.includes(permission.value) || false}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedPermissions(prev => [...(prev || []), permission.value]);
                                        } else {
                                          setSelectedPermissions(prev => (prev || []).filter(p => p !== permission.value));
                                        }
                                      }}
                                    />
                                    <Label 
                                      htmlFor={`permission-${user.id}-${permission.value}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {permission.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button onClick={handleSavePermissions}>Save Changes</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Delete button - only visible for admins */}
                        {isAdmin && (
                          <AlertDialog open={userToDelete === user.id} onOpenChange={(open) => {
                            if (open) {
                              setUserToDelete(user.id);
                            } else {
                              setUserToDelete(null);
                            }
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex items-center gap-1">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user 
                                  account for {user.name} and remove their data from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser}>Delete User</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}