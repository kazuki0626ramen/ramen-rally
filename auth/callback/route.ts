import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    // あなたのlib/supabase.tsと同じ設定を使って認証を行う
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // クッキーを使ってセッションを管理する設定
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // コードをセッションに交換
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 指定されたページ（/reset-passwordなど）へリダイレクト
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
