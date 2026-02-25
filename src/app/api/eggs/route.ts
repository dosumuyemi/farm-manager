import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = db.eggs.create({
      farmId: body.farmId,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      cageNo: body.cageNo,
      quantity: parseInt(body.quantity),
      cracks: parseInt(body.cracks) || 0,
      temperature: body.temperature ? parseFloat(body.temperature) : undefined,
      humidity: body.humidity ? parseFloat(body.humidity) : undefined,
      notes: body.notes || undefined,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating egg record:', error);
    return NextResponse.json({ error: 'Failed to create egg record' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmId = searchParams.get('farmId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const cageNo = searchParams.get('cageNo');
  const export_ = searchParams.get('export');

  try {
    const records = db.eggs.findMany({ 
      farmId: farmId || undefined, 
      cageNo: cageNo || undefined,
      month: month || undefined, 
      year: year || undefined 
    });

    if (export_ === 'csv') {
      const csvHeader = 'Date,Cage,Quantity,Cracks,Temperature,Humidity,Notes';
      const csvRows = records.map(r => 
        `${new Date(r.date).toISOString().split('T')[0]},${r.cageNo},${r.quantity},${r.cracks},${r.temperature || ''},${r.humidity || ''},"${r.notes || ''}"`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="eggs.csv"',
        },
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching egg records:', error);
    return NextResponse.json({ error: 'Failed to fetch egg records' }, { status: 500 });
  }
}
