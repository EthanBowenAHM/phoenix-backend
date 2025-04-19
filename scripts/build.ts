/* eslint-disable @typescript-eslint/no-var-requires */

const esbuild = require('esbuild');
const { resolve } = require('path');
const { readdir } = require('fs/promises');

// Shared build options for all Lambda functions
const SHARED_BUILD_OPTIONS = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: ['aws-lambda'],
  alias: {
    '@shared': resolve(__dirname, '../src/shared'),
    '@functions': resolve(__dirname, '../src/functions')
  }
};

interface LambdaFunctionInfo {
  name: string;
  path: string;
}

// Function to get all Lambda function directories
async function getLambdaFunctions(): Promise<LambdaFunctionInfo[]> {
  const functionsDir = resolve(__dirname, '../src/functions');
  const entries = await readdir(functionsDir, { withFileTypes: true });
  
  return entries
    .filter((entry: { isDirectory: () => boolean }) => entry.isDirectory())
    .map((entry: { name: string }) => ({
      name: entry.name,
      path: resolve(functionsDir, entry.name)
    }));
}

// Function to build a single Lambda function
async function buildLambdaFunction(functionInfo: LambdaFunctionInfo) {
  const { name, path } = functionInfo;
  const entryPoint = resolve(path, 'handler.ts');
  const outfile = resolve(__dirname, '../dist/functions', name, 'handler.js');

  console.log(`Building Lambda function: ${name}`);
  
  try {
    await esbuild.build({
      ...SHARED_BUILD_OPTIONS,
      entryPoints: [entryPoint],
      outfile,
    });
    console.log(`✅ Successfully built ${name}`);
  } catch (error) {
    console.error(`❌ Failed to build ${name}:`, error);
    throw error;
  }
}

// Main build function
async function buildLambdaFunctions() {
  console.log('🚀 Starting Lambda function builds...');
  
  try {
    const functions = await getLambdaFunctions();
    
    if (functions.length === 0) {
      console.warn('⚠️ No Lambda functions found in src/functions directory');
      return;
    }

    console.log(`📦 Found ${functions.length} Lambda functions to build`);
    
    // Build all functions in parallel
    await Promise.all(functions.map(buildLambdaFunction));
    
    console.log('✨ All Lambda functions built successfully!');
  } catch (error) {
    console.error('💥 Build failed:', error);
    process.exit(1);
  }
}

// Run the build
buildLambdaFunctions(); 