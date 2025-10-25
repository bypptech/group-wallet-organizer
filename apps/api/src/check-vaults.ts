import pg from 'pg';
import * as dotenv from 'dotenv';

const { Client } = pg;

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function checkVaults() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ データベースに接続しました');

    // 既存のVaultを確認
    const result = await client.query('SELECT vault_address, name, created_at FROM vaults ORDER BY created_at DESC LIMIT 10');

    console.log(`\n既存のVault数: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.log('\n⚠️  データベースにVaultが1つも存在しません');
      console.log('\n解決方法:');
      console.log('1. UI上で「Create Group」ボタンからグループを作成してください');
      console.log('2. または、テスト用のVaultを手動で追加できます');
    } else {
      console.log('\n登録されているVault:');
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.vault_address}`);
        console.log(`   名前: ${row.name}`);
        console.log(`   作成日時: ${row.created_at}`);
        console.log('');
      });
    }

    // 試行中のVaultアドレスが存在するか確認
    const targetAddress = '0x636b998315e77408806CccFCC93af4D1179afc2f';
    const checkResult = await client.query(
      'SELECT * FROM vaults WHERE vault_address = $1',
      [targetAddress]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✓ アドレス ${targetAddress} は存在します`);
    } else {
      console.log(`✗ アドレス ${targetAddress} は存在しません`);
      console.log('\nこのアドレスでInviteを作成することはできません。');
      console.log('先にこのアドレスでVaultを作成する必要があります。');
    }

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkVaults();
