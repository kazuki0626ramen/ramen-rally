const handleAddStamp = async (shopId: string, shopName: string) => {
    // 1. すでにスタンプがあるか再チェック
    if (stamps.some(s => s.shop_id === shopId)) {
      alert("このお店のスタンプは既に取得済みです！");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインセッションが切れました。再ログインしてください。");
      return;
    }

    // 2. スタンプを挿入
    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,      // 誰が
      shop_id: shopId,       // どのお店に（UUID型）
      shop_name: shopName    // お店の名前
    });

    if (error) {
      // エラーの詳細をコンソールに出すと原因がわかりやすくなります
      console.error("Stamp Error:", error);
      alert("スタンプ取得失敗: " + error.message);
    } else {
      // 3. 成功したらスタンプリストを最新の状態に更新
      const { data: updatedStamps } = await supabase
        .from("stamps")
        .select("*")
        .eq("user_id", user.id);
      
      if (updatedStamps) setStamps(updatedStamps);
    }
  };