import { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useAppContext } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function CleaningPage() {
  const { cleaningTasks, addCleaningTask, updateCleaningTask, deleteCleaningTask, toggleCleanStatus, users } = useAppContext();
  const { addNotification } = useNotifications();
  const [newTask, setNewTask] = useState({
    area: '',
    description: '',
    status: 'unclean' as 'clean' | 'unclean',
    assignedTo: ''
  });
  const [filter, setFilter] = useState<'all' | 'clean' | 'unclean'>('all');

  const filteredTasks = cleaningTasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const handleAddTask = () => {
    if (newTask.area) {
      const taskId = addCleaningTask(newTask);
      
      // Add notification for new task
      addNotification({
        title: 'New Cleaning Task',
        message: `A new cleaning task "${newTask.area}" has been added`,
        type: 'info',
      });
      
      // If task is assigned, add notification for assignee
      if (newTask.assignedTo) {
        const assignee = users.find(user => user.id === newTask.assignedTo);
        if (assignee) {
          addNotification({
            title: 'Task Assigned',
            message: `You have been assigned to clean ${newTask.area}`,
            type: 'info',
            link: '/cleaning'
          });
        }
      }
      
      setNewTask({
        area: '',
        description: '',
        status: 'unclean',
        assignedTo: ''
      });
    }
  };

  const assignTask = (id: string, userId: string) => {
    const task = cleaningTasks.find(t => t.id === id);
    if (task) {
      updateCleaningTask({ ...task, assignedTo: userId });
      
      if (userId) {
        // Find the assignee name
        const assignee = users.find(user => user.id === userId);
        if (assignee) {
          addNotification({
            title: 'Task Assigned',
            message: `You have been assigned to clean ${task.area}`,
            type: 'info',
            link: '/cleaning'
          });
        }
      }
    }
  };

  return (
    <MobileLayout title="Cleaning Tasks">
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
              variant={filter === 'clean' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('clean')}
            >
              Clean
            </Button>
            <Button
              variant={filter === 'unclean' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unclean')}
            >
              Unclean
            </Button>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cleaning Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="area">Area Name</Label>
                  <Input
                    id="area"
                    value={newTask.area}
                    onChange={(e) => setNewTask(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Enter area name (e.g. Kitchen)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter cleaning instructions"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignTo">Assign To (Optional)</Label>
                  <Select 
                    value={newTask.assignedTo || 'unassigned'} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value === 'unassigned' ? '' : value }))}
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
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="status">Initial Status:</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="status"
                      checked={newTask.status === 'clean'}
                      onCheckedChange={(checked) => 
                        setNewTask(prev => ({ 
                          ...prev, 
                          status: checked ? 'clean' : 'unclean' 
                        }))
                      }
                    />
                    <Label htmlFor="status">
                      {newTask.status === 'clean' ? 'Clean' : 'Unclean'}
                    </Label>
                  </div>
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
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No cleaning tasks found
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.area}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={task.status === 'clean' ? 'success' : 'destructive'}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    {task.assignedTo ? (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                        Assigned to: {users.find(u => u.id === task.assignedTo)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                        Unassigned
                      </span>
                    )}
                    
                    {task.lastCleaned && (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-md">
                        Last cleaned: {format(task.lastCleaned, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t">
                    <div className="space-x-2 flex items-center">
                      <div className="flex items-center gap-2">
                        <Switch 
                          id={`status-${task.id}`}
                          checked={task.status === 'clean'}
                          onCheckedChange={() => {
                            toggleCleanStatus(task.id);
                            const newStatus = task.status === 'clean' ? 'unclean' : 'clean';
                            addNotification({
                              title: 'Cleaning Status Changed',
                              message: `${task.area} is now marked as ${newStatus}`,
                              type: newStatus === 'clean' ? 'success' : 'warning',
                              link: '/cleaning'
                            });
                          }}
                        />
                        <Label htmlFor={`status-${task.id}`}>
                          {task.status === 'clean' ? 'Clean' : 'Unclean'}
                        </Label>
                      </div>
                      
                      <Select 
                        value={task.assignedTo || "unassigned"} 
                        onValueChange={(value) => assignTask(task.id, value === "unassigned" ? "" : value)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs ml-2">
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
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteCleaningTask(task.id);
                        addNotification({
                          title: 'Cleaning Task Deleted',
                          message: `"${task.area}" has been removed from cleaning tasks`,
                          type: 'info',
                        });
                      }}
                    >
                      Delete
                    </Button>
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