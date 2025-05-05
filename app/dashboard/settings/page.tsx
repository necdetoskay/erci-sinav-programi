"use client"

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox
import { Textarea } from "@/components/ui/textarea" // Import Textarea
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddProviderModal } from "@/components/settings/ai/add-provider-modal";
import { AddModelModal } from "@/components/settings/ai/add-model-modal";
import { EditModelModal } from "@/components/settings/ai/edit-model-modal"; // Import EditModelModal
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal"; // Import DeleteConfirmationModal
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession()

  // State for ALL General Settings
  const [applicationTitle, setApplicationTitle] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('tr');
  const [timeZone, setTimeZone] = useState('');
  const [defaultExamDuration, setDefaultExamDuration] = useState(60);
  const [defaultPassingScore, setDefaultPassingScore] = useState(70);
  const [enableQuestionRandomization, setEnableQuestionRandomization] = useState(false);
  const [showCorrectAnswersAfterExam, setShowCorrectAnswersAfterExam] = useState(false);
  const [allowNewUserRegistration, setAllowNewUserRegistration] = useState(true);
  const [requireAdminApprovalForNewUsers, setRequireAdminApprovalForNewUsers] = useState(false);
  const [defaultUserRole, setDefaultUserRole] = useState('USER');
  const [minimumPasswordLength, setMinimumPasswordLength] = useState(8);
  const [requireSpecialCharactersInPasswords, setRequireSpecialCharactersInPasswords] = useState(false);
  const [sessionTimeoutDuration, setSessionTimeoutDuration] = useState(30);
  const [faviconUrl, setFaviconUrl] = useState(''); // New state for Favicon URL

  // State for AI Providers and Modals
  const [aiProviders, setAiProviders] = useState<any[]>([]);
  const [isAddProviderModalOpen, setIsAddProviderModalOpen] = useState(false);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState(false); // State for edit model modal
  const [isDeleteModelModalOpen, setIsDeleteModelModalOpen] = useState(false); // State for delete model modal
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [selectedModelToEdit, setSelectedModelToEdit] = useState<{ id: number; name: string } | null>(null); // State for model being edited
  const [selectedModelToDelete, setSelectedModelToDelete] = useState<{ id: number; name: string } | null>(null); // State for model being deleted


  // Fetch settings and AI providers on component mount
  const fetchData = async () => { // Make fetchData reusable
    try {
      // Fetch general settings (including faviconUrl)
      const settingsResponse = await fetch('/api/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setApplicationTitle(settingsData.applicationTitle || '');
        setDefaultLanguage(settingsData.defaultLanguage || 'tr');
        setTimeZone(settingsData.timeZone || '');
        setDefaultExamDuration(settingsData.defaultExamDuration || 60);
        setDefaultPassingScore(settingsData.defaultPassingScore || 70);
        setEnableQuestionRandomization(settingsData.enableQuestionRandomization || false);
        setShowCorrectAnswersAfterExam(settingsData.showCorrectAnswersAfterExam || false);
        setAllowNewUserRegistration(settingsData.allowNewUserRegistration === undefined ? true : settingsData.allowUserRegistration);
        setRequireAdminApprovalForNewUsers(settingsData.requireAdminApprovalForNewUsers || false);
        setDefaultUserRole(settingsData.defaultUserRole || 'USER');
        setMinimumPasswordLength(settingsData.minimumPasswordLength || 8);
        setRequireSpecialCharactersInPasswords(settingsData.requireSpecialCharactersInPasswords || false);
        setSessionTimeoutDuration(settingsData.sessionTimeoutDuration || 30);
        setFaviconUrl(settingsData.faviconUrl || '');
      } else {
        console.error('Failed to fetch general settings.');
      }

      // Fetch AI providers
      const providersResponse = await fetch('/api/ai-providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setAiProviders(providersData);
      } else {
        console.error('Failed to fetch AI providers.');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

   // Save ALL general settings (excluding email again)
   const handleSaveGeneralSettings = async (e: React.FormEvent) => {
     e.preventDefault();
     const allSettings = {
       applicationTitle,
       defaultLanguage,
       timeZone,
       defaultExamDuration,
       defaultPassingScore,
       enableQuestionRandomization,
       showCorrectAnswersAfterExam,
       allowNewUserRegistration,
       requireAdminApprovalForNewUsers,
       defaultUserRole,
       minimumPasswordLength,
       requireSpecialCharactersInPasswords,
       sessionTimeoutDuration,
       faviconUrl, // Include new favicon setting
     };

     // console.log("Saving general settings:", allSettings); // Removed log

     try {
       const response = await fetch('/api/settings', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(allSettings),
       });

       if (response.ok) {
         // console.log('General settings saved successfully!'); // Removed log
         // TODO: Add user feedback (e.g., a toast notification for success)
       } else {
         const errorData = await response.json();
         console.error('Failed to save general settings:', errorData.error || response.statusText);
         // TODO: Add user feedback for error
       }
     } catch (error) {
       console.error('Error saving general settings:', error);
       // TODO: Add user feedback for error
     }
   };

   // Functions to manage modals (will be implemented with actual modal components)
   const openAddProviderModal = () => setIsAddProviderModalOpen(true);
   const closeAddProviderModal = () => {
     setIsAddProviderModalOpen(false);
     // Refetch data after closing modal if a provider was added
     fetchData();
   };
   const openAddModelModal = (providerId: number) => {
     setSelectedProviderId(providerId);
     setIsAddModelModalOpen(true);
   };
   const closeAddModelModal = () => {
     setSelectedProviderId(null);
     setIsAddModelModalOpen(false);
     // Refetch data after closing modal if a model was added
     fetchData();
   };
   const openEditModelModal = (model: { id: number; name: string }) => {
     setSelectedModelToEdit(model);
     setIsEditModelModalOpen(true);
   };
   const closeEditModelModal = () => {
     setSelectedModelToEdit(null);
     setIsEditModelModalOpen(false);
     // Refetch data after closing modal if a model was edited
     fetchData();
   };
   const openDeleteModelModal = (model: { id: number; name: string }) => {
     setSelectedModelToDelete(model);
     setIsDeleteModelModalOpen(true);
   };
   const closeDeleteModelModal = () => {
     setSelectedModelToDelete(null);
     setIsDeleteModelModalOpen(false);
     // Refetch data after closing modal if a model was deleted
     fetchData();
   };

   // Implement functions to add/edit/delete providers and models
   const handleAddProvider = async (providerData: { name: string; apiKey: string }) => {
     // console.log("Adding provider:", providerData); // Removed log
     try {
       const response = await fetch('/api/ai-providers', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(providerData),
       });
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to add provider');
       }
       toast.success('Sağlayıcı başarıyla eklendi.');
       closeAddProviderModal(); // Will trigger fetchData
     } catch (error: any) {
       console.error("Error adding provider:", error);
       toast.error(`Sağlayıcı eklenirken bir hata oluştu: ${error.message || error}`);
       throw error; // Re-throw to be caught by modal component
     }
   };

   const handleAddModel = async (providerId: number, modelData: { name: string }) => {
      if (!providerId) return;
      // console.log(`Adding model "${modelData.name}" to provider ${providerId}`); // Removed log
      try {
        const response = await fetch(`/api/ai-providers/${providerId}/models`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add model');
        }
        toast.success('Model başarıyla eklendi.');
        closeAddModelModal(); // Will trigger fetchData
      } catch (error: any) {
        console.error("Error adding model:", error);
        toast.error(`Model eklenirken bir hata oluştu: ${error.message || error}`);
        throw error; // Re-throw to be caught by modal component
      }
   };

   const handleEditModel = async (modelId: number, modelData: { name: string }) => {
      // console.log(`Editing model ${modelId} with data:`, modelData); // Removed log
      try {
        const response = await fetch(`/api/ai-models/${modelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modelData),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to edit model');
        }
        toast.success('Model başarıyla güncellendi.');
        closeEditModelModal(); // Will trigger fetchData
      } catch (error: any) {
        console.error("Error editing model:", error);
        toast.error(`Model düzenlenirken bir hata oluştu: ${error.message || error}`);
        throw error; // Re-throw to be caught by modal component
      }
   };

   const handleDeleteModel = async () => {
      if (!selectedModelToDelete) return;
      // console.log(`Deleting model ${selectedModelToDelete.id}`); // Removed log
      try {
        const response = await fetch(`/api/ai-models/${selectedModelToDelete.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete model');
        }
        toast.success('Model başarıyla silindi.');
        closeDeleteModelModal(); // Will trigger fetchData
      } catch (error: any) {
        console.error("Error deleting model:", error);
        toast.error(`Model silinirken bir hata oluştu: ${error.message || error}`);
      }
   };


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Ayarlar</h1>

      <Tabs defaultValue="ai-settings" className="space-y-4"> {/* Default to ai-settings tab */}
        <TabsList>
          <TabsTrigger value="ai-settings">Yapay Zeka</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-settings">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between"> {/* Adjusted header for button */}
                <CardTitle>Yapay Zeka Sağlayıcıları</CardTitle>
                <Button size="sm" onClick={openAddProviderModal}>Yeni Sağlayıcı Ekle</Button> {/* Add Provider Button */}
             </CardHeader>
             <CardContent className="space-y-4">
                {/* List AI Providers here */}
                {aiProviders.length === 0 ? (
                  <p className="text-muted-foreground">Henüz bir yapay zeka sağlayıcısı eklenmedi.</p>
                ) : (
                  <div className="space-y-2">
                    {aiProviders.map(provider => (
                      <div key={provider.id} className="flex items-start justify-between p-3 border rounded-md gap-4"> {/* Use items-start and gap */}
                        <div className="flex-grow"> {/* Allow provider name and model list to take space */}
                          <p className="font-medium">{provider.name}</p>
                          {/* Display Models for this provider as a list */}
                          {provider.models && provider.models.length > 0 ? (
                            <ul className="mt-2 space-y-1 list-disc list-inside pl-4">
                              {provider.models.map((model: any) => (
                                <li key={model.id} className="text-sm text-muted-foreground flex justify-between items-center group"> {/* Add group for hover */}
                                  <span>{model.name}</span>
                                  {/* Edit/Delete buttons for Model (visible on hover) */}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => openEditModelModal(model)} title="Modeli Düzenle">
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-red-500 hover:text-red-600" onClick={() => openDeleteModelModal(model)} title="Modeli Sil">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                             <p className="text-sm text-muted-foreground mt-1">Bu sağlayıcı için model eklenmedi.</p>
                          )}
                        </div>
                        {/* Buttons for Provider */}
                        <div className="flex flex-col gap-1 items-end flex-shrink-0"> {/* Align buttons vertically, prevent shrinking */}
                           <Button variant="outline" size="sm" onClick={() => openAddModelModal(provider.id)}>Model Ekle</Button>
                           <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => alert(`Edit provider ${provider.id}`)} title="Sağlayıcıyı Düzenle">
                             <Pencil className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => alert(`Delete provider ${provider.id}`)} title="Sağlayıcıyı Sil">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>
        </TabsContent>
       </Tabs>

       {/* Render Modals */}
       <AddProviderModal isOpen={isAddProviderModalOpen} onClose={closeAddProviderModal} onAddProvider={handleAddProvider} />
       <AddModelModal isOpen={isAddModelModalOpen} onClose={closeAddModelModal} onAddModel={handleAddModel} providerId={selectedProviderId} />
       <EditModelModal isOpen={isEditModelModalOpen} onClose={closeEditModelModal} onEditModel={handleEditModel} model={selectedModelToEdit} />
       <DeleteConfirmationModal
          isOpen={isDeleteModelModalOpen}
          onClose={closeDeleteModelModal}
          onConfirm={handleDeleteModel}
          title="Modeli Sil?"
          description={`'${selectedModelToDelete?.name}' modelini kalıcı olarak silmek istediğinizden emin misiniz?`}
        />

     </div>
   )
 }
