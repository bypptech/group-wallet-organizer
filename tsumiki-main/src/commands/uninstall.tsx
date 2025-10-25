import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { Box, Newline, render, Text } from "ink";
import React, { useEffect, useState } from "react";

type UninstallStatus =
  | "starting"
  | "checking"
  | "removing"
  | "completed"
  | "error"
  | "not_found";

const UninstallComponent: React.FC = () => {
  const [status, setStatus] = useState<UninstallStatus>("starting");
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performUninstall = async (): Promise<void> => {
      try {
        setStatus("checking");

        // 現在のディレクトリを取得
        const currentDir = process.cwd();
        const targetDir = path.join(currentDir, ".claude", "commands");

        // .claude/commandsディレクトリが存在するかチェック
        const dirExists = await fs.pathExists(targetDir);
        if (!dirExists) {
          setStatus("not_found");
          setTimeout(() => {
            process.exit(0);
          }, 2000);
          return;
        }

        // tsumikiのcommandsディレクトリを取得
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // ビルド後はdist/commandsを参照（cli.jsがdist/にあるため）
        const tsumikiDir = path.join(__dirname, "commands");

        // tsumikiのファイル一覧を取得
        const tsumikiFiles = await fs.readdir(tsumikiDir);
        const tsumikiTargetFiles = tsumikiFiles.filter(
          (file) => file.endsWith(".md") || file.endsWith(".sh"),
        );

        setStatus("removing");

        // .claude/commands内のファイルをチェックして、tsumiki由来のファイルのみ削除
        const installedFiles = await fs.readdir(targetDir);
        const removedFilesList: string[] = [];

        for (const file of installedFiles) {
          if (tsumikiTargetFiles.includes(file)) {
            const filePath = path.join(targetDir, file);
            await fs.remove(filePath);
            removedFilesList.push(file);
          }
        }

        // 削除後に.claude/commandsディレクトリが空になったかチェック
        const remainingFiles = await fs.readdir(targetDir);
        if (remainingFiles.length === 0) {
          // 空のディレクトリを削除
          await fs.rmdir(targetDir);
          // .claudeディレクトリも空の場合は削除
          const claudeDir = path.dirname(targetDir);
          const claudeFiles = await fs.readdir(claudeDir);
          if (claudeFiles.length === 0) {
            await fs.rmdir(claudeDir);
          }
        }

        setRemovedFiles(removedFilesList);
        setStatus("completed");

        // 2秒後に終了
        setTimeout(() => {
          process.exit(0);
        }, 2000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        setStatus("error");

        setTimeout(() => {
          process.exit(1);
        }, 3000);
      }
    };

    performUninstall();
  }, []);

  if (status === "starting") {
    return (
      <Box>
        <Text color="cyan">🗑️ Tsumiki アンインストールを開始します...</Text>
      </Box>
    );
  }

  if (status === "checking") {
    return (
      <Box>
        <Text color="yellow">📋 インストール状況をチェック中...</Text>
      </Box>
    );
  }

  if (status === "removing") {
    return (
      <Box>
        <Text color="blue">🗑️ コマンドテンプレートを削除中...</Text>
      </Box>
    );
  }

  if (status === "not_found") {
    return (
      <Box flexDirection="column">
        <Text color="yellow">
          ⚠️ .claude/commands ディレクトリが見つかりません
        </Text>
        <Text color="gray">Tsumikiはインストールされていないようです。</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ エラーが発生しました:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (status === "completed") {
    if (removedFiles.length === 0) {
      return (
        <Box flexDirection="column">
          <Text color="yellow">⚠️ 削除対象のファイルが見つかりませんでした</Text>
          <Text color="gray">
            Tsumikiのコマンドはインストールされていないようです。
          </Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        <Text color="green">✅ アンインストールが完了しました!</Text>
        <Newline />
        <Text>削除されたファイル ({removedFiles.length}個):</Text>
        {removedFiles.map((file) => (
          <Text key={file} color="gray">
            {" "}
            • {file}
          </Text>
        ))}
        <Newline />
        <Text color="cyan">
          TsumikiのClaude Codeコマンドテンプレートが削除されました。
        </Text>
      </Box>
    );
  }

  return null;
};

export const uninstallCommand = (): void => {
  render(React.createElement(UninstallComponent));
};
