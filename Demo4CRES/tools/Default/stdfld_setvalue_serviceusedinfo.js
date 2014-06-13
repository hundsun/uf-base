/************************************************************
 *** JSfile   : stdfld_setvalue_serviceusedinfo.js
 *** Author   : zhuyf
 *** Date     : 2013-9-16
 *** Notes    : 该用户脚本用于批量设置标准字段列表使用情况信息
 *这里涉及的资源类型，主要是服务接口和对象类型
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="标准字段列表使用情况信息";//说明信息

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var stdInfo = project.getMetadataInfoByType("stdfield");// 标准字段资源
		stdInfo.becomeWorkingCopy();//资源信息转换为可写对象
		var stdflds = stdInfo.getItems();// 标准字段条目
		var serviceUsedMap = analyseService();//分析哪些标准字段已被使用，在一个Map中存储已使用的标准字段
		var objUsedMap = analyseObject();//分析哪些标准字段已被使用，在一个Map中存储已使用的标准字段
		if (stdflds.length > 0) {
		for(var i in stdflds) {
			var stdfld = stdflds[i];//标准字段对象
			var stdfld_name = stdfld.getName();//标准字段名称
			if(serviceUsedMap.containsKey(stdfld_name) || objUsedMap.containsKey(stdfld_name)){//如果在Map中存在，则已被使用
				stdfld.setExtendsValue("interface_used","true");//使用状态设置为已使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
				var used_detail = "";
				var subsyses = project.getSubSystems("com.hundsun.ares.studio.jres.moduleroot.business");//获取子系统列表，返回一个数组
				for(var j in subsyses){
					var subsys = subsyses[j].getFullyQualifiedName();//子系统名称
					if(serviceUsedMap.get(stdfld_name) != null && serviceUsedMap.get(stdfld_name).containsKey(subsys))
					{
						stdfld.setExtendsValue("usedin_" + subsys,"true");//该属性用于说明在哪个子系统中使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
						var used_info = serviceUsedMap.get(stdfld_name).get(subsys);//使用说明信息，返回一个List
						//追加使用说明信息
						used_detail += stdfld_name + "在子系统[" + subsys +"]中的服务 " + used_info + " 中使用过。\r\n";
					}else{
						stdfld.setExtendsValue("usedin_" + subsys,"false");
					}
				}
				for(var j in subsyses){
					var subsys = subsyses[j].getFullyQualifiedName();//子系统名称
					if(objUsedMap.get(stdfld_name) != null && objUsedMap.get(stdfld_name).containsKey(subsys))
					{
						stdfld.setExtendsValue("usedin_" + subsys,"true");//该属性用于说明在哪个子系统中使用，该属性为用户扩展属性，在项目属性/用户属性扩展中配置
						var used_info = objUsedMap.get(stdfld_name).get(subsys);//使用说明信息，返回一个List
						//追加使用说明信息
						used_detail += stdfld_name + "在子系统[" + subsys +"]中的业务对象 " + used_info + " 中使用过。\r\n";
					}else{
						stdfld.setExtendsValue("usedin_" + subsys,"false");
					}
				}
				stdfld.setExtendsValue("interface_used_detail",used_detail);//该属性为用户扩展属性，在项目属性/用户属性扩展中配置
			}else{
				stdfld.setExtendsValue("interface_used","false");//该字段未使用
				var subsyses = project.getSubSystems("com.hundsun.ares.studio.jres.moduleroot.business");//获取子系统列表，返回一个数组
				for(var j in subsyses){
					var subsys = subsyses[j];//子系统名称
					stdfld.setExtendsValue("usedin_" + subsys,"false");
				}
				stdfld.setExtendsValue("interface_used_detail",stdfld_name + "未在接口设计中使用");
			}
		}
		stdInfo.save();//使用情况分析结果信息保存
		output.dialog("标准字段使用情况已分析，结果信息已保存，可通过打开标准字段编辑器查看！");
		output.info("标准字段使用情况已分析，结果信息已保存，可通过打开标准字段编辑器查看！");
		}else{
			output.dialog("标准字段为空，无法设置使用信息！");
			output.info("标准字段为空，无法设置使用信息！");
		}
	}

	/**
	 * 分析哪些标准字段已经在服务接口中使用
	 * 返回分析结果，为Map结构，key为参数名，value为Map（key为子系统名称，value为List，List中一项为一个服务接口）
	 */
	function analyseService() {
		var usedMap = stringutil.getMap();
		var subsyses = project.getSubSystems("com.hundsun.ares.studio.jres.moduleroot.business");//获取子系统列表，返回一个数组
		for( var i in subsyses){
			var subsys = subsyses[i].getFullyQualifiedName();//子系统名称
			output.info("正在分析子系统[" + subsys + "]");
			var resources = project.getServicesBySubsys(subsys);//获取对应子系统下服务接口资源
			for ( var j in resources ) {
				var info = resources[j];
				if ( info != null ) {
					if (info.getType().toLowerCase() == "service") {// 服务接口
						var serviceName = info.getName();// 服务名
						var objId = info.getId();
						var serviceChineseName = info.getChineseName();//服务中文名
						output.info("正在分析服务[" + serviceName +"]");
						var input_params = info.getInputParameters();//入参
						for(var k in input_params) {
							var input_param_name = input_params[k].getName();//参数名
							output.info("正在分析入参[" + input_param_name + "]");
							if(usedMap.containsKey(input_param_name)){
								//Map中以标准字段名称作为key，存放分析结果，以Map形式存放分析结果
								if(usedMap.get(input_param_name).containsKey(subsys)){
									//分析结果也是一个Map结构，以子系统名称为key，以List存放使用的表信息
									usedMap.get(input_param_name).get(subsys).add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
								}else{
									var usedServiceList = stringutil.getList();
									usedServiceList.add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
									usedMap.get(input_param_name).put(subsys,usedServiceList);
								}
							}else{
								var subMap = stringutil.getMap();
								var usedServiceList = stringutil.getList();
								usedServiceList.add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
								subMap.put(subsys,usedServiceList);
								usedMap.put(input_param_name,subMap);
							}
						}
						var output_params = info.getOutputParameters();//出参
						for(var k in output_params) {
							var output_param_name = output_params[k].getName();//参数名
							output.info("正在分析出参[" + output_param_name + "]");
							if(usedMap.containsKey(output_param_name)){
								//Map中以标准字段名称作为key，存放分析结果，以Map形式存放分析结果
								if(usedMap.get(output_param_name).containsKey(subsys)){
									//分析结果也是一个Map结构，以子系统名称为key，以List存放使用的表信息
									usedMap.get(output_param_name).get(subsys).add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
								}else{
									var usedServiceList = stringutil.getList();
									usedServiceList.add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
									usedMap.get(output_param_name).put(subsys,usedServiceList);
								}
							}else{
								var subMap = stringutil.getMap();
								var usedServiceList = stringutil.getList();
								usedServiceList.add("(" + objId + ")" + serviceName + "-" + serviceChineseName);
								subMap.put(subsys,usedServiceList);
								usedMap.put(output_param_name,subMap);
							}
						}
					}
				}
			}
		}
		return usedMap;
	}
	
	/**
	 * 分析哪些标准字段已经在业务对象中使用
	 * 返回分析结果，为Map结构，key为参数名，value为Map（key为子系统名称，value为List，List中一项为一个业务对象）
	 */
	function analyseObject() {
		var usedMap = stringutil.getMap();
		var subsyses = project.getSubSystems("com.hundsun.ares.studio.jres.moduleroot.business");//获取子系统列表，返回一个数组
		for( var i in subsyses){
			var subsys = subsyses[i].getFullyQualifiedName();//子系统名称
			output.info("正在分析子系统[" + subsys + "]");
			var resources = project.getObjectsBySubsys(subsys);//获取对应子系统下业务对象资源
			for ( var j in resources ) {
				var info = resources[j];
				if ( info != null ) {
					if (info.getType().toLowerCase() == "object") {// 业务对象
						var objName = info.getName();// 对象名
						var objChineseName = info.getChineseName();//对象中文名
						output.info("正在分析业务对象[" + objName +"]");
						var attributes = info.getAttributes();
						for(var k in attributes) {
							var attribute_name = attributes[k].getName();//参数名
							output.info("正在分析属性[" + attribute_name + "]");
							if(usedMap.containsKey(attribute_name)){
								//Map中以标准字段名称作为key，存放分析结果，以Map形式存放分析结果
								if(usedMap.get(attribute_name).containsKey(subsys)){
									//分析结果也是一个Map结构，以子系统名称为key，以List存放使用的表信息
									usedMap.get(attribute_name).get(subsys).add(objName + "-" + objChineseName);
								}else{
									var usedObjList = stringutil.getList();
									usedObjList.add(objName + "-" + objChineseName);
									usedMap.get(attribute_name).put(subsys,usedObjList);
								}
							}else{
								var subMap = stringutil.getMap();
								var usedObjList = stringutil.getList();
								usedObjList.add(objName + "-" + objChineseName);
								subMap.put(subsys,usedObjList);
								usedMap.put(attribute_name,subMap);
							}
						}
					}
				}
			}
		}
		return usedMap;
	}