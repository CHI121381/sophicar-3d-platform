/**
 * 简单测试脚本 - 验证小车模型位置和地面设置
 * Simple test script - Verify car model positioning and ground settings
 */

// 等待页面加载完成
window.addEventListener('load', async () => {
  console.log('🚀 开始测试小车模型位置和地面设置...');
  
  // 等待应用初始化
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  if (window.sophicarApp) {
    const app = window.sophicarApp;
    const sceneManager = app.getSceneManager();
    
    console.log('📊 场景状态检查:');
    console.log('- 场景对象数量:', sceneManager.scene.children.length);
    
    // 检查是否有真实车辆模型
    const realVehicle = sceneManager.getObject('sophicar_real_vehicle');
    const fallbackVehicle = sceneManager.getObject('sophicar_fallback_vehicle');
    
    if (realVehicle) {
      console.log('✅ 真实车辆模型加载成功!');
      console.log('- 模型名称:', realVehicle.name);
      console.log('- 模型位置:', `(${realVehicle.position.x.toFixed(2)}, ${realVehicle.position.y.toFixed(2)}, ${realVehicle.position.z.toFixed(2)})`);
      console.log('- 模型旋转:', `(${realVehicle.rotation.x.toFixed(2)}, ${realVehicle.rotation.y.toFixed(2)}, ${realVehicle.rotation.z.toFixed(2)})`);
      console.log('- 子对象数量:', realVehicle.children.length);
      
      // 检查小车是否已上移
      if (realVehicle.position.y > 0.1) {
        console.log('✅ 小车已上移，当前高度为:', realVehicle.position.y.toFixed(3), '米');
        console.log('✅ 基础高度为:', realVehicle.userData.baseHeight?.toFixed(3) || '未设置', '米');
      } else {
        console.log('⚠️ 小车可能未正确上移，当前高度:', realVehicle.position.y.toFixed(3), '米');
      }
    } else if (fallbackVehicle) {
      console.log('⚠️ 使用备用车辆模型');
      console.log('- 模型名称:', fallbackVehicle.name);
      console.log('- 模型位置:', `(${fallbackVehicle.position.x.toFixed(2)}, ${fallbackVehicle.position.y.toFixed(2)}, ${fallbackVehicle.position.z.toFixed(2)})`);
      
      // 检查备用小车是否已上移
      if (fallbackVehicle.position.y > 0.1) {
        console.log('✅ 备用小车已上移，当前高度为:', fallbackVehicle.position.y.toFixed(3), '米');
        console.log('✅ 基础高度为:', fallbackVehicle.userData.baseHeight?.toFixed(3) || '未设置', '米');
      } else {
        console.log('⚠️ 备用小车可能未正确上移，当前高度:', fallbackVehicle.position.y.toFixed(3), '米');
      }
    } else {
      console.log('❌ 未找到车辆模型');
    }
    
    // 检查地面设置
    const ground = sceneManager.getObject('ground');
    if (ground) {
      console.log('✅ 地面对象存在');
      console.log('- 地面名称:', ground.name);
      console.log('- 地面位置:', `(${ground.position.x.toFixed(2)}, ${ground.position.y.toFixed(2)}, ${ground.position.z.toFixed(2)})`);
      console.log('- 地面可选择性:', ground.userData.selectable !== false ? '可选择' : '不可选择');
    }
    
    // 检查是否还有导航区域圆圈
    let foundNavigationAreas = false;
    sceneManager.scene.traverse((object) => {
      if (object.name && object.name.includes('navigationArea')) {
        console.log('⚠️ 发现导航区域:', object.name);
        foundNavigationAreas = true;
      }
    });
    
    if (!foundNavigationAreas) {
      console.log('✅ 确认：没有发现导航区域圆圈');
    }
    
    // 调用天空对象检查和删除
    setTimeout(() => {
      const result = app.checkSkyObjects();
      console.log(`🧹 天空清理结果: 总共${result.total}个对象，删除${result.removed}个，剩余${result.remaining}个`);
    }, 1000);
    
    // 列出所有场景对象
    console.log('📋 场景中的所有对象:');
    sceneManager.getAllObjects().forEach((object, id) => {
      const pos = object.position;
      const selectable = object.userData.selectable !== false ? '可选择' : '不可选择';
      console.log(`- ${id}: ${object.name || object.type} - 位置:(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}) - ${selectable}`);
    });
    
  } else {
    console.log('❌ Sophicar应用未找到');
  }
});