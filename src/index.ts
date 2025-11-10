#!/usr/bin/env node

import { program } from "commander";
import { execSync } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
import inquirer from "inquirer";

// .env ファイルの読み込み処理
const homeEnvPath = path.join(os.homedir(), ".env");

if (fs.existsSync(homeEnvPath)) {
  dotenv.config({ path: homeEnvPath });
} else {
  dotenv.config();
}

// gitmojiを追加
const gitmojiMap: { [key: string]: string } = {
  feat: "✨", // 新機能
  fix: "🐛", // バグ修正
  docs: "📝", // ドキュメント
  style: "💄", // スタイル (コードフォーマットなど)
  refactor: "♻️", // リファクタリング
  test: "✅", // テスト
  chore: "🧹", // 雑務 (ビルドプロセス修正など)
  ci: "🤖", // CI/CD
  perf: "⚡️", // パフォーマンス改善
};

// コミットメッセージにgitmojiを追加する
function addGitmoji(message: string): string {
  try {
    const match = message.match(/^([a-z]+)(\(.*\))?(:.*)/);
    if (!match) return message; // マッチしない場合はそのまま返す

    const prefix = match[1];
    const scope = match[2] || "";
    const rest = match[3];

    const emoji = gitmojiMap[prefix];
    if (!emoji) return message;

    const subject = rest.substring(1).trim();

    return `${prefix}${scope}: ${emoji} ${subject}`;
  } catch (error) {
    console.warn("Gitmojiの追加処理中にエラーが発生しました。");
    return message;
  }
}

// git diff --staged の結果を取得する
function getStagedDiff(): string | null {
  try {
    // git diff --staged コマンドを実行し、結果をUTF-8文字列として取得
    const diff = execSync("git diff --staged").toString("utf8");

    if (!diff.trim()) {
      return null; // ステージされた変更がない
    }
    return diff;
  } catch (error) {
    console.error("エラー: git diffの取得に失敗しました。");
    console.error("gitリポジトリの内部で実行しているか確認してください。");
    return null;
  }
}

// Gemini APIにコミットメッセージの生成をリクエストする
async function generateCommitMessage(diff: string): Promise<string> {
  // process.envからAPIキーを読み込む
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "エラー: GEMINI_API_KEY が設定されていません。\nホームディレクトリ(~)または実行ディレクトリに .env ファイルを置いてください。"
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    以下のgitの差分（diff）を分析し、Conventional Commits形式のコミットメッセージを1行で生成してください。
    形式は "<type>(<scope>): <subject>" です。
    
    差分の内容から、"fix:", "feat:", "test:", "docs:", "refactor:", "style:", "chore:" などを適切に選択してください。
    日本語で簡潔にお願いします。

    --- 差分ここから ---
    ${diff}
    --- 差分ここまで ---
    `;

    console.log("Geminiにメッセージ生成を依頼中...");

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text
      .replace(/```(plaintext|json|javascript|typescript|)?/g, "")
      .trim();
  } catch (error) {
    console.error("エラー: Gemini APIへのリクエストに失敗しました。");
    // APIからのエラー詳細を表示
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// 指定されたメッセージで git commit を実行する
function executeGitCommit(message: string) {
  try {
    const escapedMessage = message.replace(/"/g, '\\"');
    execSync(`git commit -m "${escapedMessage}"`);
    console.log("\n✅ コミットが正常に作成されました。");
  } catch (error) {
    console.error("\nエラー: git commit の実行に失敗しました。");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// --- CLIの定義 ---
program
  .version("1.0.2")
  .description(
    "git diff --staged の内容からAIがコミットメッセージを生成し、対話形式でコミットします (gitmoji対応)"
  )
  .action(async () => {
    const diff = getStagedDiff();

    if (!diff) {
      console.log(
        "ステージされた変更はありません。`git add` してから実行してください。"
      );
      process.exit(0);
    }

    try {
      const aiMessage = await generateCommitMessage(diff);

      const messageWithGitmoji = addGitmoji(aiMessage);

      console.log("\n✅ AIによるコミットメッセージの提案:\n");
      console.log(messageWithGitmoji);
      console.log("---------------------------------");

      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "このメッセージでコミットしますか？",
          choices: [
            { name: "はい (Yes)", value: "yes" },
            { name: "修正 (Edit)", value: "edit" },
            { name: "中止 (No)", value: "no" },
          ],
        },
      ]);

      switch (answers.action) {
        case "yes":
          executeGitCommit(messageWithGitmoji);
          break;

        case "edit":
          const editAnswer = await inquirer.prompt([
            {
              type: "input",
              name: "newMessage",
              message: "コミットメッセージを修正してください:",
              default: messageWithGitmoji,
            },
          ]);
          if (editAnswer.newMessage.trim()) {
            executeGitCommit(editAnswer.newMessage.trim());
          } else {
            console.log("メッセージが空のため、コミットを中止しました。");
          }
          break;

        case "no":
          console.log("コミットを中止しました。");
          process.exit(0);
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
