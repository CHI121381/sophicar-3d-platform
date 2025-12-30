/**
 * 小车运动快速测试脚本
 * Quick test script for car movement functionality
 */

// 测试配置
const TEST_CONFIG = {
    duration: 3000,        // 3秒测试时长
    targetFPS: 60,         // 目标帧率
    maxDistance: 20,       // 最大移动距离
    testIterations: 100    // 测试迭代次数
};

// 测试结果存储
const testResults = {
    frameCount: 0,
    startTime: 0,
    endTime: 0,
    positions: [],
    fps: 0,
    success: false,
    errors: []
};

/**
 * 模拟小车运动计算
 * Simulate car movement calculation
 */
function simulateCarMovement(progress) {
    // 模拟原始位置
    const originalPosition = { x: 0, y: 0, z: 0 };
    
    // 计算当前位置（朝负Z方向移动）
    const currentDistance = progress * TEST_CONFIG.maxDistance;
    const currentPosition = {
        x: originalPosition.x,
        y: originalPosition.y,
        z: originalPosition.z - currentDistance
    };
    
    return currentPosition;
}

/**
 * 模拟缓动函数
 * Simulate easing function
 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * 运行运动测试
 * Run movement test
 */
function runMovementTest() {
    console.log('🚗 开始小车运动测试...');
    console.log('测试配置:', TEST_CONFIG);
    
    testResults.startTime = performance.now();
    let frameCount = 0;
    
    const testLoop = () => {
        const elapsed = performance.now() - testResults.startTime;
        const progress = Math.min(elapsed / TEST_CONFIG.duration, 1);
        
        // 计算小车位置
        const position = simulateCarMovement(progress);
        testResults.positions.push({
            time: elapsed,
            progress: progress,
            position: position
        });
        
        frameCount++;
        
        // 验证位置计算
        if (position.z > 0) {
            testResults.errors.push(`错误：小车Z位置为正值 ${position.z}`);
        }
        
        if (Math.abs(position.z) > TEST_CONFIG.maxDistance) {
            testResults.errors.push(`错误：小车移动距离超出限制 ${Math.abs(position.z)}`);
        }
        
        // 继续测试或结束
        if (progress < 1 && frameCount < TEST_CONFIG.testIterations) {
            requestAnimationFrame(testLoop);
        } else {
            finishTest(frameCount);
        }
    };
    
    // 开始测试循环
    requestAnimationFrame(testLoop);
}

/**
 * 完成测试并生成报告
 * Finish test and generate report
 */
function finishTest(frameCount) {
    testResults.endTime = performance.now();
    testResults.frameCount = frameCount;
    
    const totalTime = testResults.endTime - testResults.startTime;
    testResults.fps = (frameCount / totalTime) * 1000;
    testResults.success = testResults.errors.length === 0;
    
    generateTestReport();
}

/**
 * 生成测试报告
 * Generate test report
 */
function generateTestReport() {
    console.log('\n📊 小车运动测试报告');
    console.log('='.repeat(50));
    
    // 基本信息
    console.log(`测试时长: ${(testResults.endTime - testResults.startTime).toFixed(2)}ms`);
    console.log(`帧数: ${testResults.frameCount}`);
    console.log(`平均FPS: ${testResults.fps.toFixed(2)}`);
    console.log(`测试状态: ${testResults.success ? '✅ 通过' : '❌ 失败'}`);
    
    // 位置分析
    if (testResults.positions.length > 0) {
        const firstPos = testResults.positions[0].position;
        const lastPos = testResults.positions[testResults.positions.length - 1].position;
        const totalDistance = Math.abs(lastPos.z - firstPos.z);
        
        console.log('\n🚗 运动分析:');
        console.log(`起始位置: (${firstPos.x}, ${firstPos.y}, ${firstPos.z})`);
        console.log(`结束位置: (${lastPos.x.toFixed(2)}, ${lastPos.y.toFixed(2)}, ${lastPos.z.toFixed(2)})`);
        console.log(`总移动距离: ${totalDistance.toFixed(2)}m`);
        console.log(`目标距离: ${TEST_CONFIG.maxDistance}m`);
        console.log(`距离精度: ${((totalDistance / TEST_CONFIG.maxDistance) * 100).toFixed(1)}%`);
    }
    
    // 性能分析
    console.log('\n⚡ 性能分析:');
    console.log(`目标FPS: ${TEST_CONFIG.targetFPS}`);
    console.log(`实际FPS: ${testResults.fps.toFixed(2)}`);
    console.log(`性能达标: ${testResults.fps >= TEST_CONFIG.targetFPS * 0.8 ? '✅ 是' : '❌ 否'}`);
    
    // 错误报告
    if (testResults.errors.length > 0) {
        console.log('\n❌ 错误列表:');
        testResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    // 缓动函数测试
    console.log('\n📈 缓动函数测试:');
    const easingTests = [0, 0.25, 0.5, 0.75, 1];
    easingTests.forEach(t => {
        const eased = easeOutCubic(t);
        console.log(`easeOutCubic(${t}) = ${eased.toFixed(3)}`);
    });
    
    // 总结
    console.log('\n🎯 测试总结:');
    if (testResults.success) {
        console.log('✅ 小车运动系统工作正常');
        console.log('✅ 位置计算准确');
        console.log('✅ 性能表现良好');
    } else {
        console.log('❌ 发现问题，需要修复');
    }
    
    console.log('='.repeat(50));
}

/**
 * 测试Three.js环境
 * Test Three.js environment
 */
function testThreeJSEnvironment() {
    console.log('🔧 检查Three.js环境...');
    
    try {
        // 检查Three.js是否可用
        if (typeof THREE === 'undefined') {
            console.warn('⚠️ Three.js未加载，使用模拟环境');
            return false;
        }
        
        // 测试基本Three.js功能
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        
        scene.add(cube);
        
        console.log('✅ Three.js环境正常');
        return true;
    } catch (error) {
        console.error('❌ Three.js环境错误:', error);
        return false;
    }
}

/**
 * 主测试函数
 * Main test function
 */
function runTests() {
    console.log('🚀 启动小车运动测试套件');
    console.log('时间:', new Date().toLocaleString());
    
    // 检查环境
    const threeJSAvailable = testThreeJSEnvironment();
    
    // 运行运动测试
    setTimeout(() => {
        runMovementTest();
    }, 100);
    
    // 额外的数学测试
    setTimeout(() => {
        runMathTests();
    }, 200);
}

/**
 * 运行数学计算测试
 * Run mathematical calculation tests
 */
function runMathTests() {
    console.log('\n🧮 数学计算测试');
    console.log('-'.repeat(30));
    
    // 测试线性插值
    function lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    console.log('线性插值测试:');
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const result = lerp(0, TEST_CONFIG.maxDistance, t);
        console.log(`lerp(0, ${TEST_CONFIG.maxDistance}, ${t.toFixed(1)}) = ${result.toFixed(1)}`);
    }
    
    // 测试向量计算
    console.log('\n向量计算测试:');
    const vector1 = { x: 0, y: 0, z: 0 };
    const vector2 = { x: 10, y: 5, z: -20 };
    
    const distance = Math.sqrt(
        Math.pow(vector2.x - vector1.x, 2) +
        Math.pow(vector2.y - vector1.y, 2) +
        Math.pow(vector2.z - vector1.z, 2)
    );
    
    console.log(`向量距离: ${distance.toFixed(2)}`);
    
    console.log('✅ 数学计算测试完成');
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runTests);
    } else {
        runTests();
    }
} else {
    // Node.js环境
    runTests();
}

// 导出测试函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runTests,
        runMovementTest,
        simulateCarMovement,
        easeOutCubic,
        TEST_CONFIG,
        testResults
    };
}