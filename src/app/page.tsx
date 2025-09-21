/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Define a proper type for our contacts
interface Contact {
  _id: Id<"contacts">;
  _creationTime: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  image?: string;
}

export default function ContactsPage() {
  const contactsData = useQuery(api.contacts.getContacts) || [];
  // Cast to our Contact type with safe fallbacks for undefined values
  const contacts: Contact[] = contactsData.map((contact: any) => ({
    _id: contact._id,
    _creationTime: contact._creationTime,
    first_name: contact.first_name || "",
    last_name: contact.last_name || "",
    email: contact.email || "",
    phone: contact.phone || "",
    title: contact.title || "",
    image: contact.image || "",
  }));

  const createContact = useMutation(api.contacts.createContact);
  const editContact = useMutation(api.contacts.editContact);
  const deleteContact = useMutation(api.contacts.deleteContact);
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const storeUserImage = useMutation(api.upload.storeUserImage);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"contacts"> | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    title: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"contacts"> | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for modal
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchLower) ||
      (contact.last_name || "").toLowerCase().includes(searchLower) ||
      (contact.email || "").toLowerCase().includes(searchLower) ||
      (contact.phone || "").toLowerCase().includes(searchLower)
    );
  });

  const startEdit = (c: Contact) => {
    setEditingId(c._id);
    setForm({
      first_name: c.first_name,
      last_name: c.last_name || "",
      email: c.email || "",
      phone: c.phone || "",
      title: c.title || "",
    });
    setPreview(c.image || null);
    setOpen(true);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

// ... existing code ...

const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    let imageUrl: string | undefined = undefined; // Initialize as undefined instead of null
    if (file) {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const result = await storeUserImage({ storageId });
      imageUrl = result || undefined; // Ensure we don't assign null
    }

    if (editingId) {
      await editContact({ id: editingId, ...form, image: imageUrl });
    } else {
      await createContact({ ...form, image: imageUrl });
    }

    setOpen(false);
    setForm({ first_name: "", last_name: "", email: "", phone: "", title: "" });
    setFile(null);
    setPreview(null);
    setEditingId(null);
  } catch (error) {
    console.error("Error saving contact:", error);
    alert("Failed to save contact. Please try again.");
  } finally {
    setLoading(false);
  }
};

// ... existing code ...

  const handleDelete = async (id: Id<"contacts">) => {
    try {
      await deleteContact({ id });
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", title: "" });
    setFile(null);
    setPreview(null);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleCloseModal();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Contacts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white w-full"
                aria-label="Search contacts"
              />
            </div>
            
            <button
              onClick={() => setOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition flex items-center justify-center gap-2"
              aria-label="Add new contact"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Contact</span>
            </button>
          </div>
        </header>

        {/* Contacts List */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-4">
              {searchTerm ? 'No contacts found' : 'No contacts yet'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {searchTerm ? 'Try a different search term' : 'Get started by adding your first contact'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setOpen(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredContacts.map((c) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col"
                >
                  <div className="flex items-center gap-4">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={`${c.first_name} ${c.last_name || ''}`}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-800 dark:text-indigo-200 font-medium text-lg">
                          {c.first_name[0]}{c.last_name?.[0] || ''}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {c.first_name} {c.last_name || ''}
                      </div>
                      {c.title && (
                        <div className="text-sm text-indigo-600 dark:text-indigo-400 truncate">
                          {c.title}
                        </div>
                      )}
                      {c.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {c.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <button
                      onClick={() => startEdit(c)}
                      className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 transition"
                      aria-label={`Edit ${c.first_name} ${c.last_name || ''}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    {deleteConfirmId === c._id ? (
                      <div className="flex gap-2 bg-red-50 dark:bg-red-900/20 p-1 rounded-lg">
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-1 rounded-md bg-red-600 text-white"
                          aria-label="Confirm deletion"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          aria-label="Cancel deletion"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(c._id)}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 transition"
                        aria-label={`Delete ${c.first_name} ${c.last_name || ''}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCloseModal}
                aria-hidden="true"
              />
              
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md z-10 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingId ? "Edit Contact" : "New Contact"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    aria-label="Close dialog"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow">
                          <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 cursor-pointer shadow">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={onFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name *
                      </label>
                      <input
                        id="first_name"
                        ref={firstInputRef}
                        required
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        placeholder="First name"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        placeholder="Last name"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Email"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Phone"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        id="title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Title"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}