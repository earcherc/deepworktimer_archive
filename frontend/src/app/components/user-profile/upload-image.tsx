'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import useToast from '@app/context/toasts/toast-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Body_upload_profile_photo_upload_upload_profile_photo_post, UploadsService, User, UsersService } from '@api';

type FormData = {
  image: FileList;
};

export default function ImageUploadForm() {
  const { register, handleSubmit, setValue, reset } = useForm<FormData>();
  const { addToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => UsersService.readCurrentUserUsersMeGet(),
  });

const uploadMutation = useMutation({
  mutationFn: async (file: File) => {
    const formData: Body_upload_profile_photo_upload_upload_profile_photo_post = {
      file: file,
    };
    return UploadsService.uploadProfilePhotoUploadUploadProfilePhotoPost(formData);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    addToast({ type: 'success', content: 'Image uploaded successfully' });
    reset();
    setPreview(null);
    setSelectedFile(null);
    // You can use data.original_url, data.medium_url, or data.thumbnail_url here if needed
  },
  onError: (error: any) => {
    console.error('Image upload error:', error);
    addToast({ type: 'error', content: 'An error occurred while uploading the image' });
  },
});

  const onSubmit = async () => {
    if (!selectedFile) {
      addToast({ type: 'error', content: 'No image selected' });
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  const removeImage = () => {
    setPreview(null);
    setSelectedFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setValue('image', null as unknown as FileList);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('image', event.target.files as FileList);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-8">
      <div className="col-span-full flex items-center gap-x-8">
        {user?.profile_photo_url ? (
          <Image
            src={user.profile_photo_url}
            alt="Preview Image"
            className="h-24 w-24 flex-none rounded-lg bg-gray-800 object-cover"
            width={96}
            height={96}
          />
        ) : preview ? (
          <Image
            src={preview}
            alt="Profile Image"
            className="h-24 w-24 flex-none rounded-lg bg-gray-800 object-cover"
            width={96}
            height={96}
          />
        ) : (
          <div className="h-24 w-24 flex-none rounded-lg bg-gray-800" />
        )}
        <div>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
            onClick={() => imageInputRef.current?.click()}
          >
            {preview ? 'Change Image' : 'Select Image'}
          </button>
          {selectedFile && (
            <>
              <button
                type="button"
                className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-400 ml-2"
                onClick={removeImage}
              >
                Remove
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ml-2"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Image'}
              </button>
            </>
          )}
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            hidden
            {...register('image', {
              onChange: handleFileChange,
            })}
            ref={imageInputRef}
          />
          <p className="mt-2 text-xs leading-5 text-gray-400">JPG, JPEG, PNG. 10MB max.</p>
        </div>
      </div>
    </form>
  );
}