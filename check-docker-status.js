#!/usr/bin/env node

const { execSync } = require('child_process');

function runCommand(command, description) {
  console.log(`\n🔍 ${description}`);
  console.log('─'.repeat(50));
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(output);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

function checkDockerStatus() {
  console.log('🐳 DOCKER STATUS REPORT');
  console.log('='.repeat(50));
  
  // Check Docker version and daemon status
  runCommand('docker --version', 'Docker Version');
  runCommand('docker compose version', 'Docker Compose Version');
  
  // Check if Docker daemon is running
  runCommand('docker info --format "{{.ServerVersion}}"', 'Docker Daemon Status');
  
  // Show all containers
  runCommand('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"', 'All Containers Status');
  
  // Show running containers only
  runCommand('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"', 'Running Containers');
  
  // Show project-specific containers
  runCommand('docker compose ps', 'Project Containers (docker compose)');
  
  // Show container resource usage
  console.log('\n📊 Container Resource Usage');
  console.log('─'.repeat(50));
  try {
    const stats = execSync('docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"', { encoding: 'utf8' });
    console.log(stats);
  } catch (error) {
    console.log('❌ No running containers or Docker not accessible');
  }
  
  // Check Docker networks
  runCommand('docker network ls', 'Docker Networks');
  
  // Check Docker volumes
  runCommand('docker volume ls', 'Docker Volumes');
  
  // Show project-specific network
  runCommand('docker network inspect lms_lms-network --format "{{.Name}}: {{len .Containers}} containers"', 'Project Network Info');
  
  console.log('\n✅ Docker status check completed!');
}

checkDockerStatus();