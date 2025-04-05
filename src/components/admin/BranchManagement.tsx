
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Trash2
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { get, ref, set, remove, onValue } from "firebase/database";
import { database } from "@/lib/firebase";

interface Branch {
  id: string;
  name: string;
}

const BranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  // Load branches from database
  useEffect(() => {
    const branchesRef = ref(database, "branches");
    
    const unsubscribe = onValue(branchesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setBranches([]);
        return;
      }
      
      const branchesList: Branch[] = [];
      
      Object.keys(data).forEach((key) => {
        branchesList.push({
          id: key,
          name: data[key].name
        });
      });
      
      setBranches(branchesList);
    });
    
    return () => unsubscribe();
  }, []);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!branchName.trim()) {
      toast({
        title: "Error",
        description: "Branch name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a new ID for the branch
      const branchesRef = ref(database, "branches");
      const newBranchRef = ref(database, `branches/${Date.now()}`);
      
      // Add the branch to the database
      await set(newBranchRef, {
        name: branchName
      });
      
      toast({
        title: "Branch added",
        description: `${branchName} has been added successfully.`,
      });
      
      // Reset form
      setBranchName("");
      setIsAddingBranch(false);
    } catch (error: any) {
      toast({
        title: "Failed to add branch",
        description: error.message || "An error occurred while adding the branch.",
        variant: "destructive",
      });
      console.error("Error adding branch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string) => {
    if (window.confirm(`Are you sure you want to delete ${branchName}?`)) {
      try {
        await remove(ref(database, `branches/${branchId}`));
        
        toast({
          title: "Branch deleted",
          description: `${branchName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Failed to delete branch",
          description: "An error occurred while deleting the branch.",
          variant: "destructive",
        });
        console.error("Error deleting branch:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Branches</h2>
        
        <Dialog open={isAddingBranch} onOpenChange={setIsAddingBranch}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>
                Create a new branch for your educational institution.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddBranch} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="branchName">Branch Name</Label>
                <Input
                  id="branchName"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Computer Science"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingBranch(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                      Adding...
                    </span>
                  ) : "Add Branch"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center h-40">
              <p className="text-slate-500">No branches added yet</p>
              <Button 
                variant="link" 
                onClick={() => setIsAddingBranch(true)}
                className="mt-2"
              >
                Add your first branch
              </Button>
            </CardContent>
          </Card>
        ) : (
          branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{branch.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteBranch(branch.id, branch.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BranchManagement;
