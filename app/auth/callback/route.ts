import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    // あなたのプロジェクト設定（環境変数）を読み込み
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // 標準的なSupabaseクライアントを作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 【重要】認証コードをセッション（ログイン状態）に交換
    // これにより、この後の画面で「ログイン済みのユーザー」として扱えます
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 認証が完了したら、目的のページ（/reset-password）へリダイレクト
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
