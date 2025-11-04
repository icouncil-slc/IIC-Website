"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'sonner';
import { useEdgeStore } from '@/lib/edgestore';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const studentRoles = [
  "President", "Coordinator", "Outreach Coordinator", "Innovation Activity Coordinator", 
  "Secretary", "Treasurer", "Marketing And PR Head", "Content Head", "Event Management Head", 
  "Graphic's and Design Head", "Technical Head", "Marketing & PR", "Content Writing", 
  "Event Management", "Graphics", "Technical Team"
];
const facultyRoles = ["IIC, SLC Principal", "Convener", "Dept. of Physics", "Dept. of Mathematics", "Dept. of Computer Science", "Dept. of Commerce", "Dept. of Chemistry", "Dept. of Economics"];

export default function ManageTeamPage() {
  const { data: session, status } = useSession();
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { edgestore } = useEdgeStore();
  const formRef = useRef(null);

  // Form State
  const [editingMemberId, setEditingMemberId] = useState(null); // Sirf ID store karein
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('Student');
  const [image, setImage] = useState('');
  const [departmentSlug, setDepartmentSlug] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get('/api/team/all');
      setTeamMembers(res.data.members);
    } catch (err) {
      toast.error('Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeamMembers();
    }
  }, [status]);

  const resetForm = () => {
    setEditingMemberId(null);
    setName(''); setRole(''); setCategory('Student'); setImage(''); setDepartmentSlug('');
    setLinkedin(''); setInstagram(''); setFile(null);
  };

  const handleEdit = (member) => {
    setEditingMemberId(member._id);
    setName(member.name);
    setRole(member.role);
    setCategory(member.category);
    setImage(member.image);
    setDepartmentSlug(member.departmentSlug || '');
    setLinkedin(member.linkedin || '');
    setInstagram(member.instagram || '');
    setFile(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !role || (!image && !file && !editingMemberId)) {
      toast.error('Please fill in Name, Role, and provide an Image.');
      return;
    }
    setIsSubmitting(true);
    let finalImageUrl = image;

    if (file) {
      setIsUploading(true);
      try {
        // Agar edit kar rahe hain to purani image ko replace karein
        const oldImageUrl = editingMemberId ? teamMembers.find(m => m._id === editingMemberId)?.image : undefined;
        const res = await edgestore.publicFiles.upload({ 
          file, 
          options: { replaceTargetUrl: oldImageUrl } 
        });
        finalImageUrl = res.url;
      } catch (err) {
        toast.error('Image upload failed.');
        setIsSubmitting(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const memberData = { 
      name, role, category, image: finalImageUrl, 
      departmentSlug, linkedin, instagram 
    };

    try {
      if (editingMemberId) {
        // Update request (PUT)
        await axios.put('/api/team/all', { id: editingMemberId, ...memberData });
        toast.success('Team member updated successfully!');
      } else {
        // Create request (POST)
        await axios.post('/api/team', memberData);
        toast.success('Team member added successfully!');
      }
      resetForm();
      fetchTeamMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await axios.delete('/api/team/all', { data: { id } });
        toast.success('Member deleted successfully!');
        fetchTeamMembers();
      } catch (err) {
        toast.error('Failed to delete member.');
      }
    }
  };

  const availableRoles = category === 'Student' ? studentRoles : facultyRoles;
  
  // Role ko reset karein agar category change hoti hai
  useEffect(() => {
    // Jab category change ho, to role ko reset kar dein,
    // lekin agar hum edit kar rahe hain to reset na karein.
    if (!editingMemberId) {
      setRole('');
    }
  }, [category, editingMemberId]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <h1 className="text-4xl font-bold">Manage Team</h1>
      
      {/* Add/Edit Form */}
      <div ref={formRef} className="bg-white p-8 rounded-xl shadow-lg border">
        <h2 className="text-2xl font-semibold mb-6">{editingMemberId ? 'Edit Team Member' : 'Add New Team Member'}</h2>
        <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2">
                  <option>Student</option>
                  <option>Faculty</option>
                </select>
              </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Role / Position</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" required>
                  <option value="" disabled>Select a role</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Slug (for URL, e.g., 'marketing')</label>
              <input type="text" value={departmentSlug} onChange={(e) => setDepartmentSlug(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                  <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                  <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image Upload</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}
              <p className="text-center text-sm text-gray-500 my-2">Or, paste existing image URL below.</p>
              <input type="url" placeholder="https://example.com/image.png" value={image} onChange={(e) => setImage(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            
            {/* --- YAHAN FIX HAI --- */}
            <div className="flex gap-4 flex-col">
              {editingMemberId && (
                <Button type="button" variant="outline" onClick={resetForm} className="w-full justify-center">
                  Cancel Edit
                </Button>
              )}
              <Button type="submit"  disabled={isSubmitting || isUploading} className="w-full justify-center">
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  editingMemberId ? 'Update Member' : 'Add Member'
                )}
              </Button>
            </div>
            {/* --- FIX ENDS HERE --- */}
            
          </form>
        </div>

      {/* Team List */}
      <div className="bg-white p-8 rounded-xl shadow-lg border">
          <h2 className="text-2xl font-semibold mb-6">Current Team</h2>
          {isLoading ? <p>Loading team...</p> : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {teamMembers.map(member => (
                <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Image src={member.image} alt={member.name} width={40} height={40} className="rounded-full object-cover" />
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="icon" onClick={() => handleEdit(member)}><Edit className="h-4 w-4" /></Button>
                     <Button variant="destructive" className="bg-red-600 hover:bg-red-700"  size="icon" onClick={() => handleDelete(member._id, member.name)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
