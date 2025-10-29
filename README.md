ai-commit-cli 🤖

git diff の内容を AI (Gemini) が分析し、Conventional Commits 形式のコミットメッセージを自動生成する CLI ツールです。

gitmoji にも対応しており、AI が生成した提案を対話形式で確認・修正し、そのままコミットまで実行できます。

## ✨ 主な機能

- AI によるメッセージ生成: `git diff --staged` の内容を Gemini API に送信し、`feat:`/`fix:`/`test:` などの Conventional Commits 形式で提案を生成します。
- Gitmoji 対応: 提案されたコミットタイプに基づき、該当する絵文字（例: ✨、🐛、🧪）をメッセージ先頭に自動挿入します。
- 対話型インターフェース: AI の提案を「はい(Yes)」「修正(Edit)」「中止(No)」で選択できます。Edit を選ぶと編集後にコミットされます。
- 自動コミット: 「Yes」または「Edit」を選択すると `git commit -m "..."` を自動で実行します。

## 💿 インストールとセットアップ

1. リポジトリのクローン（開発用）

```bash
git clone https://github.com/dem3860/ai-commit-cli.git
cd ai-commit-cli
```

2. 依存関係のインストール

```bash
npm install
```

3. API キーの設定 (最重要)

このツールは Google Gemini（Gemini API）を利用します。実行には API キーが必要です。

1. Google AI Studio で API キーを取得してください。
2. あなたのホームディレクトリに `~/.env` ファイルを作成します:

```bash
cd ~
nano .env
```

開いたエディタに以下の形式で API キーを貼り付けて保存してください。

```
GEMINI_API_KEY="AIzaSy...YOUR_API_KEY...xxxx"
```

注: このツールは実行時にホームディレクトリの `~/.env` を自動で読み込みます。

4. ツールのビルドとリンク

TypeScript をコンパイルし、`gcommit` コマンドをグローバルにリンクします。

```bash
# 1. TS -> JS にビルド
npm run build

# 2. 'gcommit' をグローバルにリンク
npm link
```

## 🚀 使い方

任意の Git プロジェクトで通常通り変更を `git add` した後に `gcommit` を実行します。これが `git commit` の代わりになります。

```bash
# 変更をステージ
git add .

# gcommit を実行
gcommit
```

実行例:

```text
$ gcommit
Geminiにメッセージ生成を依頼中...

✅ AIによるコミットメッセージの提案:

feat(api): ✨ ユーザー取得エンドポイントのエラーハンドリングを追加
---------------------------------
? このメッセージでコミットしますか？ (Use arrow keys)
❯ はい (Yes)
	修正 (Edit)
	中止 (No)
```

「はい」を選べばそのままコミットが完了します。修正を選べば提案内容を編集してからコミットできます。

## 📝 注意事項

- API キーの管理は慎重に行ってください。公開リポジトリにキーを置かないでください。
- Gemini API の利用にはコストがかかる可能性があります。大量利用や自動化する場合は料金体系を確認してください。
- 自動でコミットされるため、内容をよく確認してから「はい(Yes)」を選択してください。
- 提案されたコミットメッセージはあくまで参考です。最終的な判断はユーザー自身が行ってください。

## 📄 ライセンス

This project is licensed under the MIT License.
