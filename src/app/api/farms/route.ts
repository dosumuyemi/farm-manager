import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncService } from '@/lib/sync';

function sanitizeString(str: string | undefined, maxLength = 200): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Farm name is required' }, { status: 400 });
    }

    const record = {
      name: sanitizeString(body.name, 100),
      animal_type: sanitizeString(body.animalType, 50) || 'Chicken',
      category: sanitizeString(body.category, 50) || 'Layers',
      quantity: parseInt(body.quantity) || 0,
      age_weeks: parseInt(body.ageWeeks) || 0,
      average_weight: body.averageWeight ? parseFloat(body.averageWeight) : null,
    };

    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('animal_houses')
        .insert(record)
        .select()
        .single();
      
      if (!error) {
        // Create default cells for the house
        const houseId = data.id;
        const rows = ['A', 'B', 'C'];
        const positions = [1, 2, 3];
        
        const cells = [];
        for (const row of rows) {
          for (const pos of positions) {
            cells.push({
              house_id: houseId,
              name: `${row}${pos}`,
              row_name: row,
              position: pos,
              capacity: 50,
              current_count: 0,
              status: 'empty',
            });
          }
        }
        
        await supabase.from('cells').insert(cells);
        syncService.addToQueue('animal_houses', 'create', record);
        
        return NextResponse.json(data);
      }
    }

    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error creating farm:', error);
    return NextResponse.json({ error: 'Failed to create farm' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('animal_houses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return NextResponse.json(data);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching farms:', error);
    return NextResponse.json({ error: 'Failed to fetch farms' }, { status: 500 });
  }
}
