import type { MeetingMinutes, MeetingMinutesFormData } from '../api';

// Keep track of the next ID to use
let nextId = 2; // Start from 2 since we have a default item with ID 1

export const mockMeetingMinutesApi = {
  getMeetingMinutes: async (): Promise<MeetingMinutes[]> => {
    return [
      {
        id: 1,
        title: 'Rapat Anggota Tahunan',
        description: 'Pembahasan program kerja dan evaluasi kegiatan',
        date: new Date().toISOString().split('T')[0],
        document_url: '',
        event_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  },

  getMeetingMinutesById: async (id: number): Promise<MeetingMinutes> => {
    return {
      id,
      title: 'Rapat Anggota Tahunan',
      description: 'Pembahasan program kerja dan evaluasi kegiatan',
      date: new Date().toISOString().split('T')[0],
      document_url: '',
      event_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  createMeetingMinutes: async (data: MeetingMinutesFormData): Promise<MeetingMinutes> => {
    // Create a new meeting minutes object with the provided data
    const newMinutes: MeetingMinutes = {
      id: nextId++,
      title: data.title,
      description: data.description,
      date: data.date,
      document_url: data.document_url || '',
      event_id: data.event_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return newMinutes;
  }
};