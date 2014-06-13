/************************************************************
 *** JSfile   : stdfld_used_analyse.js
 *** Author   : liaogc
 *** Date     : 2013-11-4
 *** Notes    : 分析标准字段使用情况
 *这里分析的对象包含所有可以使用标准字段的资源。
 ************************************************************/

/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
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
		var std_type = "jres.md.stdfield";//引用类型
		var noused_detail = stringutil.getStringBuffer();
		for(var i in stdflds) {
			var stdfld = stdflds[i];//标准字段对象
			var stdfld_name = stdfld.getName();//标准字段名称
			var resList = reference.getRefResources(std_type,stdfld_name, project.getARESProject());
			if(resList.size()==0){
				noused_detail.append(stdfld_name + "\r\n");//拼接没有使用的标准字段
				stdfld.setExtendsValue("isused","flase");//设置是否使用值
				stdfld.setExtendsValue("isdelete","true");//是否删除
				stdfld.setExtendsValue("used_detail","");//设置使用情况详细信息
			}else{
				var used_detail = stringutil.getStringBuffer();
				var iterator =  resList.iterator();
				while(iterator.hasNext()){
					var resource =  iterator.next();
					used_detail.append(resource.getFullyQualifiedName()+"."+resource.getType());//拼接使用情况信息
					if(iterator.hasNext()){
						used_detail.append(",");
					}
				}
				
				stdfld.setExtendsValue("isused","true");//设置是否使用值
				stdfld.setExtendsValue("isdelete","false");//是否删除
				stdfld.setExtendsValue("used_detail","在这些资源:"+used_detail.toString()+"使用过");//设置使用情况详细信息
			}
			
		}
		stdInfo.save();
		var file_path = fileOutputLocation + "\\" + "std_used.analyse.txt";
		file.write(file_path,"以下标准字段没有使用过:\r\n"+noused_detail,charset);//生成文件
		file_path = file.getAbsolutePath();
	  	output.dialog("成功生成标准使用情况报表，生成路径为：" + file_path);
		output.info("成功生成标准使用情况报表，生成路径为：" + file_path);
	}

	