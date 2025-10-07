/**
 * Script de test manuel pour les GitHub Tools
 * Usage: node --experimental-strip-types test-github-tools.ts [owner] [repo]
 * Exemple: node --experimental-strip-types test-github-tools.ts 1904labs dom-to-image-more
 */

import { githubTools } from './lib/github-tools';

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
const owner = args[0] || '1904labs';
const repo = args[1] || 'dom-to-image-more';

console.log('🧪 Test des GitHub Tools');
console.log('========================\n');
console.log(`Repository de test: ${owner}/${repo}\n`);

// Récupérer les outils par leur nom
const getRepositoryInfoTool = githubTools.find(tool => tool.name === 'get_repository_info');
const getReadmeContentTool = githubTools.find(tool => tool.name === 'get_readme_content');
const getRecentActivityTool = githubTools.find(tool => tool.name === 'get_recent_activity');
const getTopContributorsTool = githubTools.find(tool => tool.name === 'get_top_contributors');

async function testTool1_RepositoryInfo() {
  console.log('📝 Test 1: get_repository_info');
  console.log('--------------------------------');
  try {
    if (!getRepositoryInfoTool) {
      throw new Error('Outil get_repository_info non trouvé');
    }

    const result = await getRepositoryInfoTool.invoke({ owner, repo });
    const data = JSON.parse(result);

    console.log('✅ Résultat:');
    console.log(`  Repository: ${data.full_name}`);
    console.log(`  Description: ${data.description || 'Aucune description'}`);
    console.log(`  Stars: ${data.stars} ⭐`);
    console.log(`  Forks: ${data.forks} 🔱`);
    console.log(`  Langage principal: ${data.language || 'Non spécifié'}`);
    console.log(`  Créé le: ${new Date(data.created_at).toLocaleDateString('fr-FR')}`);
    console.log(`  Dernière mise à jour: ${new Date(data.updated_at).toLocaleDateString('fr-FR')}`);
    console.log(`  License: ${data.license || 'Non spécifiée'}`);
    console.log(`  Issues ouvertes: ${data.open_issues}`);
    if (data.topics && data.topics.length > 0) {
      console.log(`  Topics: ${data.topics.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
  }
  console.log('\n');
}

async function testTool2_ReadmeContent() {
  console.log('📖 Test 2: get_readme_content');
  console.log('--------------------------------');
  try {
    if (!getReadmeContentTool) {
      throw new Error('Outil get_readme_content non trouvé');
    }

    const content = await getReadmeContentTool.invoke({ owner, repo });
    const preview = content.substring(0, 500);
    
    console.log('✅ Résultat (premiers 500 caractères):');
    console.log(preview + '...');
    console.log(`\nLongueur totale du README: ${content.length} caractères`);
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
  }
  console.log('\n');
}

async function testTool3_RecentActivity() {
  console.log('🔄 Test 3: get_recent_activity');
  console.log('--------------------------------');
  try {
    if (!getRecentActivityTool) {
      throw new Error('Outil get_recent_activity non trouvé');
    }

    const result = await getRecentActivityTool.invoke({ owner, repo });
    const data = JSON.parse(result);

    console.log(`✅ Résultat:\n`);
    console.log(`  Dernier commit: ${data.last_commit_message}`);
    console.log(`  Auteur: ${data.last_commit_author}`);
    console.log(`  Date: ${new Date(data.last_commit_date).toLocaleDateString('fr-FR')}`);
    
    if (data.recent_commits && data.recent_commits.length > 1) {
      console.log(`\n  Derniers commits:`);
      data.recent_commits.forEach((commit: { message: string; author: string; date: string }, i: number) => {
        const date = new Date(commit.date).toLocaleDateString('fr-FR');
        console.log(`    ${i + 1}. ${commit.message.split('\n')[0]}`);
        console.log(`       Par ${commit.author} le ${date}`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
  }
  console.log('\n');
}

async function testTool4_TopContributors() {
  console.log('👥 Test 4: get_top_contributors');
  console.log('--------------------------------');
  try {
    if (!getTopContributorsTool) {
      throw new Error('Outil get_top_contributors non trouvé');
    }

    const result = await getTopContributorsTool.invoke({ owner, repo });
    const data = JSON.parse(result);

    console.log(`✅ Résultat - Top ${data.top_contributors.length} contributeurs:\n`);
    data.top_contributors.forEach((contributor: { username: string; contributions: any; }, i: number) => {
      console.log(`  ${i + 1}. ${contributor.username.padEnd(30)} ${contributor.contributions} contributions`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
  }
  console.log('\n');
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  await testTool1_RepositoryInfo();
  await testTool2_ReadmeContent();
  await testTool3_RecentActivity();
  await testTool4_TopContributors();
  
  console.log('🎉 Tous les tests sont terminés!');
}

// Exécuter les tests
runAllTests().catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
