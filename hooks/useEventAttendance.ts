"use client"

import { useState, useEffect } from "react"
import { useAttendanceMutations } from "@/hooks/useEvents"
import { useMembers } from "@/hooks/useMembers"

export interface AttendanceRecord {
  member_id: number
  status: string
  notes: string
}

export function useEventAttendance(eventId: number | string) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const { data: members = [], isLoading: isMembersLoading } = useMembers()
  const { createOrUpdateAttendance } = useAttendanceMutations(eventId)

  // Initialize attendance records from members data
  useEffect(() => {
    if (members && Object.keys(members).length > 0) {
      // Create initial attendance records for all members
      const initialRecords = Object.entries(members).flatMap(([division, membersList]) =>
        membersList.map(member => ({
          member_id: member.id,
          status: "Hadir", // Default status is present
          notes: ""
        }))
      )
      setAttendanceRecords(initialRecords)
    }
  }, [members])

  // Function to save attendance records
  const saveAttendanceRecords = async () => {
    if (attendanceRecords.length > 0) {
      try {
        await createOrUpdateAttendance.mutateAsync(attendanceRecords)
        console.log('Attendance records saved successfully')
        return true
      } catch (error) {
        console.error('Error saving attendance records:', error)
        return false
      }
    }
    return true
  }

  return {
    attendanceRecords,
    setAttendanceRecords,
    saveAttendanceRecords,
    isMembersLoading
  }
}
