import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Columns: Day, Start Time, End Time, Activity, Category
    const headers = ['Day', 'Start Time', 'End Time', 'Activity', 'Category'];
    
    const sampleData = [
      headers,
      ['Saturday', '08:00', '09:30', 'Morning Study', 'Education'],
      ['Saturday', '10:00', '11:00', 'Team Meeting', 'Work'],
      ['Sunday', '14:00', '15:30', 'Exercise', 'Health'],
      ['Monday', '09:00', '10:30', 'Product Planning', 'Work'],
      ['Tuesday', '11:00', '12:30', 'Deep Work Block', 'Focus'],
      ['Wednesday', '15:00', '16:00', 'Review & Planning', 'Productivity'],
      ['Thursday', '16:30', '17:30', 'Skill Development', 'Learning'],
      ['Friday', '18:00', '19:30', 'Weekly Wind-down', 'Personal'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Day
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 25 }, // Activity
      { wch: 18 }, // Category
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');

    // Generate buffer
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ApexHub_Timetable_Template.xlsx"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
