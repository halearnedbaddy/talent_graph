'use client';

import { useState, useRef } from 'react';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { compressImage, uploadFileWithProgress, type UploadProgress } from '@/firebase/storage';
import type { AthleteProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Video,
  Loader2,
  Pencil,
  User,
  Upload,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  Film,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function getInitials(name: string) {
  if (!name) return '??';
  const parts = name.split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

interface EditProfileMediaDialogProps {
  profile: AthleteProfile;
}

export function EditProfileMediaDialog({ profile }: EditProfileMediaDialogProps) {
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fullName = `${profile.firstName} ${profile.lastName}`;

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string>(profile.photoUrl || '');
  const [photoUpload, setPhotoUpload] = useState<UploadProgress | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUpload, setVideoUpload] = useState<UploadProgress | null>(null);
  const [pendingVideoUrl, setPendingVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState(profile.highlightVideoTitle || '');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Bio state
  const [bio, setBio] = useState(profile.bio || '');

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show a local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setPhotoUpload({ progress: 0, state: 'running' });
    setPendingPhotoUrl(null);

    try {
      const compressed = await compressImage(file, 600, 0.85);
      const downloadUrl = await uploadFileWithProgress(
        firebaseApp,
        `profile-photos/${profile.uid}/photo.jpg`,
        compressed,
        setPhotoUpload
      );
      setPendingPhotoUrl(downloadUrl);
      setPhotoPreview(downloadUrl);
    } catch (err: any) {
      setPhotoUpload({ progress: 0, state: 'error', error: err.message });
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUpload({ progress: 0, state: 'running' });
    setPendingVideoUrl(null);

    try {
      const ext = file.name.split('.').pop() || 'mp4';
      const downloadUrl = await uploadFileWithProgress(
        firebaseApp,
        `profile-videos/${profile.uid}/highlight.${ext}`,
        file,
        setVideoUpload
      );
      setPendingVideoUrl(downloadUrl);
    } catch (err: any) {
      setVideoUpload({ progress: 0, state: 'error', error: err.message });
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    }
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      const updates: Record<string, any> = {
        bio: bio.trim() || null,
        highlightVideoTitle: videoTitle.trim() || null,
        updatedAt: new Date().toISOString(),
      };
      if (pendingPhotoUrl) updates.photoUrl = pendingPhotoUrl;
      if (pendingVideoUrl) updates.highlightVideoUrl = pendingVideoUrl;

      await updateDoc(doc(firestore, 'athletes', profile.uid), updates);
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
      setOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (photoUpload?.state === 'running' || videoUpload?.state === 'running') return;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-bold" onClick={() => setOpen(true)}>
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black">Edit Your Profile</DialogTitle>
          <DialogDescription>
            Upload a profile photo, highlight video, and write your bio.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="photo" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="photo" className="flex-1 gap-2">
              <Camera className="w-4 h-4" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="bio" className="flex-1 gap-2">
              <User className="w-4 h-4" />
              Bio
            </TabsTrigger>
          </TabsList>

          {/* ── PHOTO TAB ── */}
          <TabsContent value="photo" className="space-y-5 mt-5">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-border shadow-xl rounded-2xl">
                  <AvatarImage src={photoPreview} className="object-cover" />
                  <AvatarFallback className="text-xl font-black rounded-xl bg-neutral-100">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {photoUpload && photoUpload.state === 'running' && (
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading photo...</span>
                    <span>{photoUpload.progress}%</span>
                  </div>
                  <Progress value={photoUpload.progress} className="h-2" />
                </div>
              )}

              {photoUpload?.state === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Photo uploaded — click Save to apply
                </div>
              )}

              {photoUpload?.state === 'error' && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {photoUpload.error}
                </div>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <Button
              variant="outline"
              className="w-full gap-2 font-bold"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUpload?.state === 'running'}
            >
              {photoUpload?.state === 'running' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {photoPreview && photoPreview !== profile.photoUrl ? 'Change Photo' : 'Choose Photo'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              JPG, PNG, or WebP — max 10 MB. We'll compress it automatically.
            </p>
          </TabsContent>

          {/* ── VIDEO TAB ── */}
          <TabsContent value="video" className="space-y-5 mt-5">
            <div className="space-y-2">
              <Label className="font-bold">Video Title</Label>
              <Input
                placeholder="e.g. Season 2024/25 Highlights"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
              />
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              className="hidden"
              onChange={handleVideoSelect}
            />

            {!videoFile && !pendingVideoUrl && (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Film className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">Click to upload your highlight video</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV — up to 500 MB</p>
                </div>
              </button>
            )}

            {videoFile && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Film className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{videoFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  {videoUpload?.state !== 'running' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  )}
                </div>

                {videoUpload?.state === 'running' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading video...</span>
                      <span>{videoUpload.progress}%</span>
                    </div>
                    <Progress value={videoUpload.progress} className="h-2" />
                    <p className="text-[10px] text-muted-foreground">
                      Please don't close this dialog while uploading.
                    </p>
                  </div>
                )}

                {videoUpload?.state === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Video uploaded — click Save to apply
                  </div>
                )}

                {videoUpload?.state === 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Upload failed: {videoUpload.error}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleVideoSelect({ target: { files: [videoFile!] } } as any)}
                    >
                      Retry Upload
                    </Button>
                  </div>
                )}
              </div>
            )}

            {profile.highlightVideoUrl && !pendingVideoUrl && (
              <p className="text-xs text-muted-foreground text-center">
                You already have a highlight video. Uploading a new one will replace it.
              </p>
            )}
          </TabsContent>

          {/* ── BIO TAB ── */}
          <TabsContent value="bio" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="font-bold">Bio</Label>
              <Textarea
                placeholder="Tell scouts and clubs about yourself — your journey, strengths, and goals..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={6}
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={photoUpload?.state === 'running' || videoUpload?.state === 'running'}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 font-black"
            onClick={handleSave}
            disabled={
              isSaving ||
              photoUpload?.state === 'running' ||
              videoUpload?.state === 'running'
            }
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
