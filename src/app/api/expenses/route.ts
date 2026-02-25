import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = db.expenses.create({
      farmId: body.farmId,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      amount: parseFloat(body.amount),
      sender: body.sender || '',
      receiver: body.receiver || '',
      purpose: body.purpose || '',
      description: body.description || '',
      type: body.type || 'expense',
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmId = searchParams.get('farmId');
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const export_ = searchParams.get('export');

  try {
    const records = db.expenses.findMany({ 
      farmId: farmId || undefined, 
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (export_ === 'csv') {
      const csvHeader = 'Date,Type,Amount,Sender,Receiver,Purpose/Description';
      const csvRows = records.map(r => 
        `${new Date(r.date).toISOString().split('T')[0]},${r.type},${r.amount},"${r.sender}","${r.receiver}","${r.purpose || r.description}"`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="financial-records.csv"',
        },
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}
