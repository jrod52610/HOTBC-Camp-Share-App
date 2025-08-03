import { useState, useRef } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useAppContext } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronDown, Camera, X, Image, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { MaintenanceTask } from '@/types';

export default function MaintenancePage() {
  const { maintenanceTasks, addMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask, users } = useAppContext();
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();
  
  // Check if user has admin or maintenance permissions
  const hasManagementPermission = currentUser?.permissions.some(
    p => p === 'admin' || p === 'maintenance'
  ) || false;
  const [newTask, setNewTask] = useState<Omit<MaintenanceTask, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    photos: [],
  });
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter tasks based on status filter
  const filteredTasks = maintenanceTasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });
  
  // Sort tasks by priority (high > medium > low) and then by creation date (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    // If priorities are the same, sort by creation date (newest first)
    if (priorityComparison === 0) {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
    
    return priorityComparison;
  });

  // Handle photo uploads
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    const fileReaders: FileReader[] = [];
    const photoCount = previewPhotos.length;
    
    // Limit to max 5 photos total
    const maxPhotos = 5 - photoCount;
    const filesToProcess = Math.min(files.length, maxPhotos);
    
    if (filesToProcess <= 0) {
      alert("Maximum 5 photos allowed");
      return;
    }
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const fileReader = new FileReader();
      
      fileReaders.push(fileReader);
      
      fileReader.onload = () => {
        if (typeof fileReader.result === 'string') {
          newPhotos.push(fileReader.result);
          
          // When all files are processed
          if (newPhotos.length === filesToProcess) {
            setPreviewPhotos(prev => [...prev, ...newPhotos]);
            
            // Update the appropriate state based on whether we're editing or adding
            if (editingTask) {
              setEditingTask(prev => ({
                ...prev,
                photos: [...(prev.photos || []), ...newPhotos]
              }));
            } else {
              setNewTask(prev => ({
                ...prev,
                photos: [...(prev.photos || []), ...newPhotos]
              }));
            }
          }
        }
      };
      
      fileReader.readAsDataURL(file);
    }
  };
  
  // Remove photo from preview
  const removePhoto = (index: number) => {
    if (editingTask) {
      setEditingTask(prev => ({
        ...prev,
        photos: prev.photos?.filter((_, i) => i !== index) || []
      }));
      setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
      setNewTask(prev => ({
        ...prev,
        photos: prev.photos?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const handleAddTask = () => {
    if (newTask.title) {
      addMaintenanceTask(newTask);
      
      // Send notification for high priority tasks
      if (newTask.priority === 'high') {
        addNotification({
          title: 'High Priority Task Added',
          message: `New task added: ${newTask.title}`,
          type: 'warning',
          link: '/maintenance'
        });
      }
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        photos: [],
      });
      setPreviewPhotos([]);
    }
  };
  
  // Start editing a task
  const startEditTask = (task: MaintenanceTask) => {
    setEditingTask(task);
    setPreviewPhotos(task.photos || []);
    setIsEditDialogOpen(true);
  };
  
  // Save edited task
  const handleSaveEdit = () => {
    if (editingTask && editingTask.title) {
      updateMaintenanceTask(editingTask);
      
      addNotification({
        title: 'Task Updated',
        message: `Maintenance task "${editingTask.title}" has been updated`,
        type: 'info',
        link: '/maintenance'
      });
      
      setEditingTask(null);
      setPreviewPhotos([]);
      setIsEditDialogOpen(false);
    }
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingTask(null);
    setPreviewPhotos([]);
    setIsEditDialogOpen(false);
  };

  const updateTaskStatus = (id: string, status: 'pending' | 'in-progress' | 'completed') => {
    const task = maintenanceTasks.find(t => t.id === id);
    if (task) {
      updateMaintenanceTask({ ...task, status });
      
      // Send notification when task is completed
      if (status === 'completed') {
        addNotification({
          title: 'Task Completed',
          message: `Maintenance task "${task.title}" has been marked as completed`,
          type: 'success',
          link: '/maintenance'
        });
      }
    }
  };

  const assignTask = (id: string, userId: string) => {
    const task = maintenanceTasks.find(t => t.id === id);
    if (task) {
      updateMaintenanceTask({ ...task, assignedTo: userId });
      
      // Notify when task is assigned
      if (userId) {
        const assignedUser = users.find(u => u.id === userId);
        if (assignedUser) {
          addNotification({
            title: 'Task Assigned',
            message: `Task "${task.title}" has been assigned to ${assignedUser.name}`,
            type: 'info',
            link: '/maintenance'
          });
        }
      }
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <MobileLayout title="Maintenance Tasks">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'in-progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('in-progress')}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
          
          {/* Add Task Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Maintenance Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter task description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
                    disabled={!hasManagementPermission}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {!hasManagementPermission && (
                    <p className="text-xs text-muted-foreground">
                      Only admins and maintenance managers can set priority
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignTo">Assign To (Optional)</Label>
                  <Select 
                    value={newTask.assignedTo || 'unassigned'} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value === 'unassigned' ? '' : value }))}
                    disabled={!hasManagementPermission}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!hasManagementPermission && (
                    <p className="text-xs text-muted-foreground">
                      Only admins and maintenance managers can assign tasks
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setNewTask(prev => ({ ...prev, dueDate: date }));
                    }}
                    disabled={!hasManagementPermission}
                  />
                  {!hasManagementPermission && (
                    <p className="text-xs text-muted-foreground">
                      Only admins and maintenance managers can set due dates
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Photos (Optional)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {previewPhotos.map((photo, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`} 
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {previewPhotos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 flex flex-col items-center justify-center border border-dashed rounded-md text-muted-foreground"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-xs mt-1">Add Photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    multiple
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add up to 5 photos (tap to add)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleAddTask}>Add Task</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Maintenance Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                {editingTask && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-title">Task Title</Label>
                      <Input
                        id="edit-title"
                        value={editingTask.title}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingTask.description || ''}
                        onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select 
                        value={editingTask.priority} 
                        onValueChange={(value) => setEditingTask(prev => ({ ...prev, priority: value as 'low' | 'medium' | 'high' }))}
                        disabled={!hasManagementPermission}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      {!hasManagementPermission && (
                        <p className="text-xs text-muted-foreground">
                          Only admins and maintenance managers can change priority
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select 
                        value={editingTask.status} 
                        onValueChange={(value) => setEditingTask(prev => ({ ...prev, status: value as 'pending' | 'in-progress' | 'completed' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-assignTo">Assign To</Label>
                      <Select 
                        value={editingTask.assignedTo || 'unassigned'} 
                        onValueChange={(value) => setEditingTask(prev => ({ ...prev, assignedTo: value === 'unassigned' ? '' : value }))}
                        disabled={!hasManagementPermission}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!hasManagementPermission && (
                        <p className="text-xs text-muted-foreground">
                          Only admins and maintenance managers can assign tasks
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-dueDate">Due Date (Optional)</Label>
                      <Input 
                        id="edit-dueDate" 
                        type="date" 
                        value={editingTask.dueDate ? format(editingTask.dueDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setEditingTask(prev => ({ ...prev, dueDate: date }));
                        }}
                        disabled={!hasManagementPermission}
                      />
                      {!hasManagementPermission && (
                        <p className="text-xs text-muted-foreground">
                          Only admins and maintenance managers can set due dates
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Photos</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {previewPhotos.map((photo, index) => (
                          <div key={index} className="relative w-20 h-20">
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`} 
                              className="w-full h-full object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 w-5 h-5 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {previewPhotos.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 flex flex-col items-center justify-center border border-dashed rounded-md text-muted-foreground"
                          >
                            <Camera className="w-6 h-6" />
                            <span className="text-xs mt-1">Add Photo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No maintenance tasks found
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {sortedTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        {task.photos && task.photos.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {task.photos.map((photo, index) => (
                                <div key={index} className="relative w-16 h-16">
                                  <img 
                                    src={photo}
                                    alt={`Task photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-md border cursor-pointer"
                                    onClick={() => {
                                      // Create a full-screen preview
                                      const img = new Image();
                                      img.src = photo;
                                      const w = window.open("");
                                      if (w) {
                                        w.document.write(img.outerHTML);
                                        w.document.title = `Photo ${index + 1} - ${task.title}`;
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Badge variant={priorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={statusColor(task.status)}>
                        {task.status}
                      </Badge>
                      
                      {task.assignedTo ? (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                          Assigned to: {users.find(u => u.id === task.assignedTo)?.name || 'Unknown'}
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                          Unassigned
                        </span>
                      )}
                      
                      {task.dueDate && (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                          Due: {format(task.dueDate, 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <div className="space-x-2">
                        <Select 
                          value={task.status} 
                          onValueChange={(value) => updateTaskStatus(task.id, value as 'pending' | 'in-progress' | 'completed')}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={task.assignedTo || "unassigned"} 
                          onValueChange={(value) => assignTask(task.id, value === "unassigned" ? "" : value)}
                          disabled={!hasManagementPermission}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Assign to" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTask(task)}
                          className="flex items-center gap-1"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            const taskToDelete = task;
                            deleteMaintenanceTask(task.id);
                            
                            // Notify about task deletion
                            addNotification({
                              title: 'Task Removed',
                              message: `Maintenance task "${taskToDelete.title}" has been deleted`,
                              type: 'info',
                              link: '/maintenance'
                            });
                          }}
                        >
                          Delete
                        </Button>
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