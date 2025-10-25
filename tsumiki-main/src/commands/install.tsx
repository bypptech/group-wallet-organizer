import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";
import { Box, Newline, render, Text } from "ink";
import React, { useEffect, useState } from "react";

type InstallStatus =
  | "starting"
  | "checking"
  | "copying"
  | "completed"
  | "error";

const InstallComponent: React.FC = () => {
  const [status, setStatus] = useState<InstallStatus>("starting");
  const [copiedFiles, setCopiedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performInstall = async (): Promise<void> => {
      try {
        setStatus("checking");

        // 現在のディレクトリを取得
        const currentDir = process.cwd();
        const commandsTargetDir = path.join(currentDir, ".claude", "commands");
        const agentsTargetDir = path.join(currentDir, ".claude", "agents");

        // tsumikiのcommandsディレクトリとagentsディレクトリを取得
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // ビルド後はdist/commands, dist/agentsを参照（cli.jsがdist/にあるため）
        const tsumikiCommandsDir = path.join(__dirname, "commands");
        const tsumikiAgentsDir = path.join(__dirname, "agents");

        // .claude/commandsと.claude/agentsディレクトリが存在しない場合は作成
        await fs.ensureDir(commandsTargetDir);
        await fs.ensureDir(agentsTargetDir);

        setStatus("copying");

        // commandsディレクトリ内のすべての.mdファイルと.shファイルを取得
        const commandFiles = await fs.readdir(tsumikiCommandsDir);
        const targetCommandFiles = commandFiles.filter(
          (file) => file.endsWith(".md") || file.endsWith(".sh"),
        );

        // agentsディレクトリ内のすべての.mdファイルを取得
        let targetAgentFiles: string[] = [];
        try {
          const agentFiles = await fs.readdir(tsumikiAgentsDir);
          targetAgentFiles = agentFiles.filter((file) => file.endsWith(".md"));
        } catch {
          // agentsディレクトリが存在しない場合はスキップ
        }

        const copiedFilesList: string[] = [];

        // commandsファイルをコピー
        for (const file of targetCommandFiles) {
          const sourcePath = path.join(tsumikiCommandsDir, file);
          const targetPath = path.join(commandsTargetDir, file);

          await fs.copy(sourcePath, targetPath);
          copiedFilesList.push(`commands/${file}`);
        }

        // agentsファイルをコピー
        for (const file of targetAgentFiles) {
          const sourcePath = path.join(tsumikiAgentsDir, file);
          const targetPath = path.join(agentsTargetDir, file);

          await fs.copy(sourcePath, targetPath);
          copiedFilesList.push(`agents/${file}`);
        }

        setCopiedFiles(copiedFilesList);
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

    performInstall();
  }, []);

  if (status === "starting") {
    return (
      <Box>
        <Text color="cyan">🚀 Tsumiki インストールを開始します...</Text>
      </Box>
    );
  }

  if (status === "checking") {
    return (
      <Box>
        <Text color="yellow">📋 環境をチェック中...</Text>
      </Box>
    );
  }

  if (status === "copying") {
    return (
      <Box>
        <Text color="blue">📝 コマンドテンプレートをコピー中...</Text>
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
    return (
      <Box flexDirection="column">
        <Text color="green">✅ インストールが完了しました!</Text>
        <Newline />
        <Text>コピーされたファイル ({copiedFiles.length}個):</Text>
        {copiedFiles.map((file) => (
          <Text key={file} color="gray">
            {" "}
            • {file}
          </Text>
        ))}
        <Newline />
        <Text color="cyan">
          Claude Codeで以下のようにコマンドを使用できます:
        </Text>
        <Text color="white"> /tdd-requirements</Text>
        <Text color="white"> /kairo-design</Text>
        <Text color="white"> @agent-symbol-searcher</Text>
        <Text color="white"> ...</Text>
      </Box>
    );
  }

  return null;
};

export const installCommand = (): void => {
  render(React.createElement(InstallComponent));
};
