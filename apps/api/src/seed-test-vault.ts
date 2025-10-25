import pg from 'pg';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';

const { Client } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function seedTestVault() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ データベースに接続しました\n');

    // 既存のVaultを確認
    const existing = await client.query(
      'SELECT vault_address FROM vaults WHERE vault_address = $1',
      ['0x636b998315e77408806CccFCC93af4D1179afc2f']
    );

    if (existing.rows.length > 0) {
      console.log('✓ テスト用Vaultは既に存在します');
      console.log('  アドレス: 0x636b998315e77408806CccFCC93af4D1179afc2f');
      return;
    }

    // テスト用Vaultを作成
    const vaultId = '0x' + randomBytes(32).toString('hex');
    const vaultAddress = '0x636b998315e77408806CccFCC93af4D1179afc2f';

    await client.query(`
      INSERT INTO vaults (vault_id, name, description, vault_address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [
      vaultId,
      'テストグループ',
      'テストと開発用のグループです',
      vaultAddress
    ]);

    console.log('✓ テスト用Vaultを作成しました');
    console.log('  Vault ID: ' + vaultId);
    console.log('  Vault Address: ' + vaultAddress);
    console.log('  名前: テストグループ\n');

    // テスト用メンバーも追加
    await client.query(`
      INSERT INTO members (vault_id, address, role, weight, added_by, added_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      vaultAddress,
      '0x1281dFcB8c9bb6D456F51a47411FC41E47C85745', // あなたのウォレットアドレス
      'owner',
      1,
      '0x1281dFcB8c9bb6D456F51a47411FC41E47C85745'
    ]);

    console.log('✓ テスト用メンバーを追加しました');
    console.log('  Address: 0x1281dFcB8c9bb6D456F51a47411FC41E47C85745');
    console.log('  Role: owner\n');

    console.log('=====================================');
    console.log('セットアップ完了！');
    console.log('これでInvite作成が可能になりました。');
    console.log('=====================================');

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTestVault();
