import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function sanitizeString(str: string | undefined, maxLength = 200): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validateExpenseInput(body: any): { valid: boolean; error?: string } {
  if (!body.farmId || typeof body.farmId !== 'string') {
    return { valid: false, error: 'Invalid farmId' };
  }
  if (!body.amount || isNaN(parseFloat(body.amount))) {
    return { valid: false, error: 'Invalid amount' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateExpenseInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const record = db.expenses.create({
      farmId: sanitizeString(body.farmId),
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      amount: Math.abs(parseFloat(body.amount)),
      sender: sanitizeString(body.sender),
      receiver: sanitizeString(body.receiver),
      purpose: sanitizeString(body.purpose),
      description: sanitizeString(body.description),
      type: sanitizeString(body.type, 20),
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
