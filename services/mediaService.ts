
import { supabase } from './supabase';
import { adapters } from './adapters';
import { BookingMedia } from '../types';

export const mediaService = {
    async uploadFiles(bookingId: string, folderName: string, files: File[]): Promise<BookingMedia[]> {
        const uploadedMedia: BookingMedia[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${bookingId}/${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('photos')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                continue;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('photos')
                .getPublicUrl(filePath);

            // 3. Save Metadata to DB
            const dbMedia = adapters.bookingMedia.toDb({
                bookingId,
                folderName,
                url: publicUrl,
                filename: file.name
            });

            const { data, error: dbError } = await supabase
                .from('booking_media')
                .insert([dbMedia])
                .select()
                .single();

            if (dbError) {
                console.error('Error saving media metadata:', dbError);
                continue;
            }

            uploadedMedia.push(adapters.bookingMedia.toApp(data));
        }

        return uploadedMedia;
    },

    async getMediaByBooking(bookingId: string): Promise<BookingMedia[]> {
        const { data, error } = await supabase
            .from('booking_media')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching media:', error);
            return [];
        }

        return data.map(adapters.bookingMedia.toApp);
    },

    async getMediaByClient(clientId: string): Promise<BookingMedia[]> {
        // First get all bookings for the client
        const { data: bookings, error: bError } = await supabase
            .from('bookings')
            .select('id')
            .eq('client_id', clientId);

        if (bError || !bookings) return [];

        const bookingIds = bookings.map(b => b.id);

        const { data, error } = await supabase
            .from('booking_media')
            .select('*')
            .in('booking_id', bookingIds)
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map(adapters.bookingMedia.toApp);
    },

    async getMediaByBookings(bookingIds: string[]): Promise<BookingMedia[]> {
        if (!bookingIds.length) return [];

        const { data, error } = await supabase
            .from('booking_media')
            .select('*')
            .in('booking_id', bookingIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching media by bookings:', error);
            return [];
        }

        return data.map(adapters.bookingMedia.toApp);
    },

    async deleteMedia(mediaId: string, filePath: string): Promise<void> {
        // 1. Delete from DB
        const { error: dbError } = await supabase
            .from('booking_media')
            .delete()
            .eq('id', mediaId);

        if (dbError) throw dbError;

        // 2. Delete from Storage (filePath should be bookingId/fileName)
        const { error: storageError } = await supabase.storage
            .from('photos')
            .remove([filePath]);

        if (storageError) console.error('Error removing from storage:', storageError);
    }
};
